#!/usr/bin/env node

// Дымовой прогон http-api: поднимает мок prism и приложение, после чего
// проверяет ответы запросами.
//
// Проверяется то, что уже ломалось незаметно.
//
// Первое: REST и RPC отдают одни и те же задачи. Урок kinds курса http-api
// сравнивает два стиля на одних данных. Оба обслуживаются модулем
// custom-server/src/tasks-store.js, а те же задачи продублированы примерами в
// спецификации, откуда их берёт документация курса.
//
// Второе: коды ответов. На 404, 405, 422, 401, 201 и 204 построены
// самостоятельные работы. Часть кодов даёт prism из спецификации, а коды
// /tasks — наш код в custom-server/src/tasks-rest.js, и там их легко потерять.
//
// Третье: соответствие спецификации. Модели объявляют uint16, а динамический
// мок про это ограничение не знает и отдавал отрицательные id.
//
// Четвёртое: skip, limit и отбор по пути. Ровно то, чего не умел статичный мок
// и из-за чего уроки приходилось подгонять под сервер (FEEDBACK-371, #16).
//
// Caddy здесь не участвует: он есть только в образе, а в CI его нет. Поэтому
// prism и приложение опрашиваются напрямую по своим портам. Пути учитывают, что
// Caddy срезает префикс перед prism и оставляет его перед приложением.

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';

import expectedTasks from '../custom-server/src/data/tasks.js';

const SPEC = './tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml';
const PRISM = 'http://127.0.0.1:4011';
const APP = 'http://127.0.0.1:4010';
const TASKS = `${APP}/http-api/tasks`;
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
const start = (name, command, args) => {
  // detached обязателен. npx это обёртка, она порождает настоящий процесс внуком,
  // и SIGTERM самой обёртке внука не задевает: prism и fastify продолжают жить,
  // держат наши трубы открытыми, и прогон не завершается даже после всех проверок.
  // Поэтому каждый сервис заводится своей группой процессов и снимается целиком.
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

  await waitFor(`${PRISM}/posts`, 'prism');
  await waitFor(`${APP}/`, 'приложение');

  console.log('\nREST и RPC отдают одни и те же задачи');
  const restList = await getJson(TASKS);
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
    'total равен размеру всего набора',
    restList.body?.total === expectedTasks.length,
    `total = ${restList.body?.total}`,
  );

  console.log('\nЗапись отбирается по пути');
  for (const task of expectedTasks) {
    const one = await getJson(`${TASKS}/${task.id}`);
    const viaRpc = await rpc('tasks.get', { id: task.id });
    check(
      `GET /tasks/${task.id} отдаёт задачу ${task.id}`,
      JSON.stringify(one.body) === JSON.stringify(task),
      JSON.stringify(one.body),
    );
    check(
      `tasks.get id=${task.id} совпадает с REST`,
      JSON.stringify(viaRpc.body?.result) === JSON.stringify(one.body),
      JSON.stringify(viaRpc.body?.result),
    );
  }
  const missing = await getJson(`${TASKS}/999`);
  check('GET /tasks/999 отвечает 404', missing.status === 404, `получено ${missing.status}`);

  console.log('\nskip и limit применяются');
  const cases = [
    ['limit=2 отдаёт первые две', { skip: 0, limit: 2 }, expectedTasks.slice(0, 2)],
    ['skip=1 пропускает первую', { skip: 1, limit: 30 }, expectedTasks.slice(1)],
    ['skip=1&limit=1 отдаёт вторую', { skip: 1, limit: 1 }, expectedTasks.slice(1, 2)],
    ['skip за концом набора отдаёт пусто', { skip: 99, limit: 10 }, []],
  ];
  for (const [name, query, expected] of cases) {
    const params = new URLSearchParams(query);
    const page = await getJson(`${TASKS}?${params}`);
    check(name, JSON.stringify(page.body?.tasks) === JSON.stringify(expected), JSON.stringify(page.body?.tasks));
    check(
      `${name}: total остаётся ${expectedTasks.length}`,
      page.body?.total === expectedTasks.length,
      `total = ${page.body?.total}`,
    );
  }
  const rpcPage = await rpc('tasks.list', { skip: 1, limit: 1 });
  check(
    'tasks.list со skip и limit совпадает с REST',
    JSON.stringify(rpcPage.body?.result?.tasks) === JSON.stringify(expectedTasks.slice(1, 2)),
    JSON.stringify(rpcPage.body?.result?.tasks),
  );
  const badRange = await getJson(`${TASKS}?skip=-1`);
  check('отрицательный skip отвечает 422', badRange.status === 422, `получено ${badRange.status}`);

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

  console.log('\nКоды ответов, на них построены самостоятельные');
  const codes = [
    ['GET /nosuch → 404', `${PRISM}/nosuch`, { method: 'GET' }, 404],
    ['DELETE /tasks → 405', TASKS, { method: 'DELETE' }, 405],
    ['POST /tasks с пустым телом → 422', TASKS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, 422],
    ['DELETE /tasks/1 → 204', `${TASKS}/1`, { method: 'DELETE' }, 204],
    ['POST /posts без токена → 401', `${PRISM}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'title', body: 'body' }),
    }, 401],
    ['GET /courses без ключа → 401', `${PRISM}/courses`, { method: 'GET' }, 401],
  ];
  for (const [name, url, options, expected] of codes) {
    const { status } = await getJson(url, options);
    check(name, status === expected, `получено ${status}`);
  }

  const created = await getJson(TASKS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Новая задача', description: 'Описание' }),
  });
  check('POST /tasks с телом → 201', created.status === 201, `получено ${created.status}`);
  check(
    'созданная задача получает статус Backlog по умолчанию',
    created.body?.status === 'Backlog',
    JSON.stringify(created.body),
  );
  // Набор данных не меняется: сервер учебный, и мутации сделали бы уроки
  // невоспроизводимыми для следующего студента.
  const afterCreate = await getJson(TASKS);
  check(
    'после POST набор задач не изменился',
    JSON.stringify(afterCreate.body?.tasks) === JSON.stringify(expectedTasks),
    JSON.stringify(afterCreate.body?.tasks),
  );

  const createdPost = await getJson(`${PRISM}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer any-value' },
    body: JSON.stringify({ title: 'title', body: 'body' }),
  });
  check('POST /posts с токеном → 201', createdPost.status === 201, `получено ${createdPost.status}`);
  check(
    'созданный пост несёт authorId, проставленный сервером',
    Number.isInteger(createdPost.body?.authorId),
    JSON.stringify(createdPost.body),
  );

  const withKey = await getJson(`${PRISM}/courses`, {
    method: 'GET',
    headers: { 'X-API-KEY': 'any-value' },
  });
  check('GET /courses с ключом → 200', withKey.status === 200, `получено ${withKey.status}`);

  const login = await getJson(`${PRISM}/login`, {
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
  for (const path of ['/posts', '/posts/1', '/users', '/users/1', '/comments']) {
    const { body } = await getJson(`${PRISM}${path}`, { method: 'GET' });
    const bad = outOfRange(body, path);
    check(`${path} в границах uint16`, bad.length === 0, bad.join(', '));
  }
  const { body: coursesBody } = await getJson(`${PRISM}/courses`, {
    method: 'GET',
    headers: { 'X-API-KEY': 'any-value' },
  });
  check('/courses в границах uint16', outOfRange(coursesBody, '/courses').length === 0);
  check('/tasks в границах uint16', outOfRange(restList.body, '/tasks').length === 0);

  console.log('\nПримеры спецификации не расходятся с набором задач');
  // Документацию курса читают по спецификации, а данные отдаёт приложение, то
  // есть примеры и набор это две копии. Сверка идёт поиском подстроки: разбирать
  // YAML нечем, отдельная зависимость ради одной проверки того не стоит.
  const spec = readFileSync(SPEC, 'utf8');
  for (const task of expectedTasks) {
    check(
      `пример задачи ${task.id} есть в спецификации`,
      spec.includes(task.title) && spec.includes(task.description),
      `нет «${task.title}»`,
    );
  }
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
