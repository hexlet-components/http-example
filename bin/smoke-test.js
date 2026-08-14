#!/usr/bin/env node

// Дымовой прогон http-api: поднимает статичный мок prism и приложение, после
// чего проверяет ответы запросами.
//
// Проверяется три вещи, каждая из которых уже ломалась незаметно.
//
// Первое: REST и RPC отдают одни и те же задачи. Урок kinds курса http-api
// сравнивает два стиля на одних данных, а живут они в двух местах, в примерах
// спецификации и в custom-server/src/data/tasks.js. Правка одного места без
// второго ломает урок, и снаружи это никак не видно.
//
// Второе: коды ответов. На 404, 405, 422 и 401 построены самостоятельные, и
// переключение мока между статичным и динамическим режимом их задевает.
//
// Третье: соответствие спецификации. Модели объявляют uint16, а динамический
// мок про это ограничение не знал и отдавал отрицательные id.
//
// Каддй здесь не участвует: он есть только в образе, а в CI его нет. Поэтому
// prism и приложение опрашиваются напрямую по своим портам, как это делает
// Caddy, срезая префикс /http-api.

import { spawn } from 'node:child_process';
import { once } from 'node:events';

import expectedTasks from '../custom-server/src/data/tasks.js';

const SPEC = './tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml';
const REST = 'http://127.0.0.1:4011';
const APP = 'http://127.0.0.1:4010';
const UINT16_MAX = 65535;

const failures = [];
const children = [];

const check = (name, passed, detail = '') => {
  if (passed) {
    console.log(`  ok   ${name}`);
    return;
  }
  console.log(`  FAIL ${name}${detail ? `\n       ${detail}` : ''}`);
  failures.push(name);
};

// Вывод дочерних процессов обязательно вычитывать. Если оставить трубу без
// читателя, prism упирается в заполненный буфер и встаёт, а прогон выглядит
// зависшим без всякой диагностики. Собранный вывод печатается, только если
// сервис не поднялся.
// detached обязателен. npx это обёртка, она порождает настоящий процесс внуком,
// и SIGTERM самой обёртке внука не задевает: prism и fastify продолжают жить,
// держат наши трубы открытыми, и прогон не завершается даже после всех проверок.
// Поэтому каждый сервис заводится своей группой процессов и снимается целиком.
const start = (name, command, args) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const output = [];
  child.stdout.on('data', (chunk) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk) => output.push(chunk.toString()));
  children.push({ name, child, output });
  return child;
};

const dumpOutput = () => {
  for (const { name, output } of children) {
    console.log(`\n--- вывод ${name} ---\n${output.join('').trim() || '(пусто)'}`);
  }
};

const killGroup = (child, signal) => {
  try {
    process.kill(-child.pid, signal);
  } catch {
    // группы уже нет, значит процесс снят
  }
};

const stopAll = async () => {
  await Promise.all(children.map(async ({ child }) => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    killGroup(child, 'SIGTERM');
    await Promise.race([once(child, 'exit'), new Promise((r) => setTimeout(r, 3000))]);
    killGroup(child, 'SIGKILL');
  }));
};

const waitFor = async (url, name) => {
  for (let i = 0; i < 60; i += 1) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  dumpOutput();
  throw new Error(`${name} не поднялся за 30 секунд: ${url}`);
};

const getJson = async (url, options) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
};

const rpc = (method, params) => getJson(`${APP}/http-api/rpc`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
});

// Спецификация объявляет id, total, skip и limit как uint16. Проверяем каждое
// число ответа, а не только id, потому что отрицательный total ломал уроки так же.
const outOfRange = (value, path = '$') => {
  if (typeof value === 'number') {
    const bad = !Number.isInteger(value) || value < 0 || value > UINT16_MAX;
    return bad ? [`${path} = ${value}`] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => outOfRange(item, `${path}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => outOfRange(item, `${path}.${key}`));
  }
  return [];
};

const run = async () => {
  start('prism', 'npx', [
    'prism', 'mock', '--multiprocess=false',
    '--json-schema-faker-fillProperties=false',
    '-p', '4011', '--host', '127.0.0.1', SPEC,
  ]);
  start('app', 'npx', [
    'fastify', 'start', '-p', '4010', '-a', '127.0.0.1', 'custom-server/src/index.js',
  ]);

  await waitFor(`${REST}/tasks`, 'prism');
  await waitFor(`${APP}/`, 'приложение');

  console.log('\nREST и RPC отдают одни и те же задачи');
  const restList = await getJson(`${REST}/tasks`);
  const rpcList = await rpc('tasks.list', {});
  check('GET /tasks отвечает 200', restList.status === 200, `получено ${restList.status}`);
  check(
    'GET /tasks отдаёт набор из data/tasks.js',
    JSON.stringify(restList.body?.tasks) === JSON.stringify(expectedTasks),
    JSON.stringify(restList.body?.tasks),
  );
  check(
    'tasks.list отдаёт тот же набор, что REST',
    JSON.stringify(rpcList.body?.result?.tasks) === JSON.stringify(restList.body?.tasks),
    JSON.stringify(rpcList.body?.result?.tasks),
  );
  check(
    'total совпадает с длиной списка',
    restList.body?.total === expectedTasks.length,
    `total = ${restList.body?.total}`,
  );

  const restOne = await getJson(`${REST}/tasks/1`);
  const rpcOne = await rpc('tasks.get', { id: 1 });
  check(
    'GET /tasks/1 и tasks.get id=1 отдают одну задачу',
    JSON.stringify(restOne.body) === JSON.stringify(rpcOne.body?.result),
    `REST ${JSON.stringify(restOne.body)} против RPC ${JSON.stringify(rpcOne.body?.result)}`,
  );

  console.log('\nRPC держит ошибки в теле, а код оставляет успешным');
  const rpcMissing = await rpc('tasks.get', { id: 999 });
  const rpcUnknown = await rpc('tasks.destroy', { id: 1 });
  check('несуществующая задача: код 200', rpcMissing.status === 200, `получено ${rpcMissing.status}`);
  check('несуществующая задача: есть error', Boolean(rpcMissing.body?.error));
  check('несуществующий метод: код 200', rpcUnknown.status === 200, `получено ${rpcUnknown.status}`);
  check(
    'несуществующий метод: -32601',
    rpcUnknown.body?.error?.code === -32601,
    JSON.stringify(rpcUnknown.body?.error),
  );

  console.log('\nКоды ответов REST, на них построены самостоятельные');
  const cases = [
    ['GET /nosuch → 404', `${REST}/nosuch`, { method: 'GET' }, 404],
    ['DELETE /tasks → 405', `${REST}/tasks`, { method: 'DELETE' }, 405],
    ['POST /tasks с пустым телом → 422', `${REST}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, 422],
    ['POST /posts без токена → 401', `${REST}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'title', body: 'body' }),
    }, 401],
    ['GET /courses без ключа → 401', `${REST}/courses`, { method: 'GET' }, 401],
  ];
  for (const [name, url, options, expected] of cases) {
    const { status } = await getJson(url, options);
    check(name, status === expected, `получено ${status}`);
  }

  const created = await getJson(`${REST}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer any-value' },
    body: JSON.stringify({ title: 'title', body: 'body' }),
  });
  check('POST /posts с токеном → 201', created.status === 201, `получено ${created.status}`);
  check(
    'созданный пост несёт authorId, проставленный сервером',
    Number.isInteger(created.body?.authorId),
    JSON.stringify(created.body),
  );

  const withKey = await getJson(`${REST}/courses`, {
    method: 'GET',
    headers: { 'X-API-KEY': 'any-value' },
  });
  check('GET /courses с ключом → 200', withKey.status === 200, `получено ${withKey.status}`);

  const login = await getJson(`${REST}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'max@hotmail.com', password: 'password' }),
  });
  check(
    'POST /login отдаёт непустой token',
    typeof login.body?.token === 'string' && login.body.token.length > 0,
    JSON.stringify(login.body),
  );

  console.log('\nЧисла в ответах не выходят за uint16');
  for (const path of ['/tasks', '/tasks/1', '/posts', '/posts/1', '/users', '/users/1', '/comments']) {
    const headers = { 'X-API-KEY': 'any-value' };
    const { body } = await getJson(`${REST}${path}`, { method: 'GET', headers });
    const bad = outOfRange(body, path);
    check(`${path} в границах uint16`, bad.length === 0, bad.join(', '));
  }
  const { body: coursesBody } = await getJson(`${REST}/courses`, {
    method: 'GET',
    headers: { 'X-API-KEY': 'any-value' },
  });
  const badCourses = outOfRange(coursesBody, '/courses');
  check('/courses в границах uint16', badCourses.length === 0, badCourses.join(', '));
};

try {
  await run();
} catch (error) {
  console.log(`\nПрогон прерван: ${error.message}`);
  failures.push('прогон не дошёл до конца');
} finally {
  await stopAll();
}

if (failures.length > 0) {
  console.log(`\nПровалов: ${failures.length}`);
  process.exit(1);
}

console.log('\nВсе проверки прошли');
process.exit(0);
