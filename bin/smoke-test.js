#!/usr/bin/env node

// Дымовой прогон http-api: поднимает приложение и проверяет ответы запросами.
// Мока prism у этой спецификации больше нет, все её маршруты обслуживает
// приложение, см. custom-server/src/http-api.ts.
//
// Проверяется то, что уже ломалось незаметно.
//
// Первое: REST и RPC отдают одни и те же задачи. Урок kinds курса http-api
// сравнивает два стиля на одних данных. Оба обслуживаются модулем
// custom-server/src/tasks-store.js, а те же задачи продублированы примерами в
// спецификации, откуда их берёт документация курса.
//
// Второе: коды ответов. На 404, 405, 422, 401, 201 и 204 построены
// самостоятельные работы, причём урок kinds просит записать три *разных* кода на
// три неудачных запроса. Коды теперь дают спецификация (валидация и @useAuth),
// плагин fastify-allow (405) и обработчик ошибок (422 вместо 400), поэтому
// потерять их можно правкой любого из трёх мест.
//
// Третье: соответствие спецификации. Модели объявляют uint16, а динамический
// мок про это ограничение не знает и отдавал отрицательные id.
//
// Четвёртое: skip, limit и отбор по пути. Ровно то, чего не умел статичный мок
// и из-за чего уроки приходилось подгонять под сервер (FEEDBACK-371, #16).
//
// Caddy здесь не участвует: он есть только в образе, а в CI его нет. Приложение
// опрашивается напрямую по своему порту, с полными путями: Caddy префикс не
// срезает.

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';

import expectedComments from '../custom-server/src/data/comments.js';
import expectedCourses from '../custom-server/src/data/courses.js';
import expectedPosts from '../custom-server/src/data/posts.js';
import expectedTasks from '../custom-server/src/data/tasks.js';
import expectedUsers from '../custom-server/src/data/users.js';

const SPEC = './tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml';
const APP = 'http://127.0.0.1:4010';
const TASKS = `${APP}/http-api/tasks`;
const USERS = `${APP}/http-api/users`;
const POSTS = `${APP}/http-api/posts`;
const COMMENTS = `${APP}/http-api/comments`;
const COURSES = `${APP}/http-api/courses`;
const LOGIN = `${APP}/http-api/login`;
const KEY = { 'X-API-KEY': 'any-value' };
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
  // Флаг --options обязателен: без него fastify-cli не читает экспорт options
  // из приложения, ajv не узнаёт про format uint16 из спецификации и сборка
  // схемы падает на старте. Падает молча, кодом 1 и без единой строки вывода.
  start('app', 'npx', [
    'fastify', 'start', '--options', '-p', '4010', '-a', '127.0.0.1', 'custom-server/src/index.js',
  ]);

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

  console.log('\nКоллекции: пагинация, select и вложенные ресурсы');
  // Урок example печатает ровно этот ответ: пользователей десять, поэтому
  // страница за тридцатым пустая, а total остаётся десяткой.
  const usersSkipped = await getJson(`${USERS}?skip=30`);
  check(
    '/users?skip=30 отдаёт пустую страницу с total 10',
    JSON.stringify(usersSkipped.body) === JSON.stringify({
      users: [], total: expectedUsers.length, skip: 30, limit: 30,
    }),
    JSON.stringify(usersSkipped.body),
  );

  const postsSkipped = await getJson(`${POSTS}?skip=30`);
  check(
    '/posts?skip=30 отдаёт последнюю страницу',
    JSON.stringify(postsSkipped.body?.posts) === JSON.stringify(expectedPosts.slice(30)),
    `постов ${postsSkipped.body?.posts?.length}`,
  );
  check(
    '/posts?skip=30: total равен всему набору',
    postsSkipped.body?.total === expectedPosts.length,
    `total = ${postsSkipped.body?.total}`,
  );

  // select оставляет запрошенные поля и всегда идентификатор: без него запись
  // бесполезна, и именно так параметр показан в уроке example.
  const selected = await getJson(`${USERS}?select=firstName,email`);
  check(
    'select оставляет только запрошенные поля и id',
    JSON.stringify(Object.keys(selected.body?.users?.[0] ?? {}).sort()) === JSON.stringify(['email', 'firstName', 'id']),
    JSON.stringify(selected.body?.users?.[0]),
  );
  const selectedOne = await getJson(`${USERS}/1?select=lastName`);
  check(
    'select работает и на одиночном ресурсе',
    JSON.stringify(Object.keys(selectedOne.body ?? {}).sort()) === JSON.stringify(['id', 'lastName']),
    JSON.stringify(selectedOne.body),
  );

  // Вложенный ресурс отбирает по родителю: мок отдавал здесь весь список.
  const ownPosts = await getJson(`${USERS}/1/posts`);
  const expectedOwn = expectedPosts.filter((post) => post.authorId === 1);
  check(
    '/users/1/posts отдаёт только посты автора 1',
    JSON.stringify(ownPosts.body?.posts) === JSON.stringify(expectedOwn),
    `постов ${ownPosts.body?.posts?.length}, ожидалось ${expectedOwn.length}`,
  );
  const allPosts = await getJson(POSTS);
  check(
    '/users/1/posts не совпадает с /posts',
    JSON.stringify(ownPosts.body) !== JSON.stringify(allPosts.body),
  );
  const postComments = await getJson(`${POSTS}/1/comments`);
  check(
    '/posts/1/comments отдаёт только комментарии этого поста',
    JSON.stringify(postComments.body?.comments) === JSON.stringify(expectedComments.filter((c) => c.postId === 1)),
    JSON.stringify(postComments.body?.comments),
  );
  const nestedMissing = await getJson(`${USERS}/999/posts`);
  check('/users/999/posts → 404', nestedMissing.status === 404, `получено ${nestedMissing.status}`);

  console.log('\nОтсутствующая запись и авторизация по коллекциям');
  for (const [name, url] of [['users', USERS], ['posts', POSTS], ['comments', COMMENTS]]) {
    const { status } = await getJson(`${url}/999`);
    check(`GET /${name}/999 → 404`, status === 404, `получено ${status}`);
  }
  // Спецификация закрывает Bearer'ом изменение постов, комментариев и
  // пользователей, а создание пользователя оставляет открытым.
  const guarded = [
    ['PATCH /users/1 без токена → 401', `${USERS}/1`, 'PATCH', 401],
    ['DELETE /users/1 без токена → 401', `${USERS}/1`, 'DELETE', 401],
    ['PATCH /posts/1 без токена → 401', `${POSTS}/1`, 'PATCH', 401],
    ['DELETE /comments/1 без токена → 401', `${COMMENTS}/1`, 'DELETE', 401],
  ];
  for (const [name, url, method, expected] of guarded) {
    // Content-Type проставляется только вместе с телом: fastify отвечает 400 на
    // пустое тело при заявленном application/json, и проверка мерила бы не то.
    const options = method === 'PATCH'
      ? {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x', body: 'y', firstName: 'z' }),
      }
      : { method };
    const { status } = await getJson(url, options);
    check(name, status === expected, `получено ${status}`);
  }
  const createdUser = await getJson(USERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john@mail.com', firstName: 'John', lastName: 'Doe', password: 'secret',
    }),
  });
  check('POST /users без токена → 201', createdUser.status === 201, `получено ${createdUser.status}`);
  check(
    'созданный пользователь без пароля в ответе',
    createdUser.body !== null && !('password' in createdUser.body),
    JSON.stringify(createdUser.body),
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

  console.log('\nКоды ответов, на них построены самостоятельные');
  const codes = [
    ['GET /nosuch → 404', `${APP}/http-api/nosuch`, { method: 'GET' }, 404],
    ['DELETE /tasks → 405', TASKS, { method: 'DELETE' }, 405],
    ['POST /tasks с пустым телом → 422', TASKS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, 422],
    ['DELETE /tasks/1 → 204', `${TASKS}/1`, { method: 'DELETE' }, 204],
    ['POST /posts без токена → 401', POSTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'title', body: 'body' }),
    }, 401],
    ['GET /courses без ключа → 401', COURSES, { method: 'GET' }, 401],
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

  const createdPost = await getJson(POSTS, {
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

  const withKey = await getJson(COURSES, { method: 'GET', headers: KEY });
  check('GET /courses с ключом → 200', withKey.status === 200, `получено ${withKey.status}`);

  const login = await getJson(LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'max@hotmail.com', password: 'password' }),
  });
  check(
    'POST /login отдаёт непустой token',
    typeof login.body?.token === 'string' && login.body.token.length > 0,
    JSON.stringify(login.body),
  );


  // Ровно тот запрос, на который жалуются в тикете FEEDBACK-166: параметры
  // должны возвращаться из запроса, а список начинаться с шестой задачи.
  const asked = await getJson(`${TASKS}?skip=5&limit=10`);
  check(
    'GET /tasks?skip=5&limit=10 возвращает skip и limit из запроса',
    asked.body?.skip === 5 && asked.body?.limit === 10,
    JSON.stringify({ skip: asked.body?.skip, limit: asked.body?.limit }),
  );
  check(
    'GET /tasks?skip=5&limit=10 отдаёт десять задач начиная с шестой',
    JSON.stringify(asked.body?.tasks) === JSON.stringify(expectedTasks.slice(5, 15)),
    `получено ${asked.body?.tasks?.length} записей, первая ${asked.body?.tasks?.[0]?.id}`,
  );

  // Курсы тоже обслуживает приложение, а не мок: на моке параметры не работали.
  const coursesPage = await getJson(`${COURSES}?skip=1&limit=2`, { headers: KEY });
  check(
    '/courses?skip=1&limit=2 применяет параметры',
    JSON.stringify(coursesPage.body) === JSON.stringify({
      courses: expectedCourses.slice(1, 3), total: expectedCourses.length, skip: 1, limit: 2,
    }),
    JSON.stringify(coursesPage.body),
  );

  // Урок httpie показывает отправку формы (`http -f`), и спецификация объявляет
  // x-www-form-urlencoded у каждой операции создания. Тело разбирает
  // @fastify/formbody, а проверяет схема, поэтому проверка нужна отдельная.
  const form = await getJson(USERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'email=john@mail.com&firstName=John&lastName=Doe&password=secret',
  });
  check(
    'POST /users формой → 201',
    form.status === 201 && form.body?.firstName === 'John',
    `${form.status} ${JSON.stringify(form.body)}`,
  );

  // Урок kinds просит записать три разных кода. Совпадение любых двух делает
  // задание бессмысленным, поэтому проверяется именно различие.
  const lessonCodes = [];
  for (const [url, options] of [
    [`${APP}/http-api/nosuch`, { method: 'GET' }],
    [TASKS, { method: 'DELETE' }],
    [TASKS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }],
  ]) {
    const { status } = await getJson(url, options);
    lessonCodes.push(status);
  }
  check(
    'три неудачных запроса из урока kinds дают три разных кода',
    new Set(lessonCodes).size === 3,
    JSON.stringify(lessonCodes),
  );

  const allowHeader = await fetch(TASKS, { method: 'DELETE' });
  check(
    '405 несёт заголовок Allow',
    (allowHeader.headers.get('allow') ?? '').includes('GET'),
    `Allow: ${allowHeader.headers.get('allow')}`,
  );

  console.log('\nОстальные три спецификации ведут себя так же');
  // Ожидания выписаны здесь заново, а не взяты из кода: прогон утверждает
  // поведение спецификаций. Матрица снята с typespec/<app>/services/, и различия
  // в ней настоящие: задачи курса Postman закрыты Basic, включая чтение одной
  // задачи, а у js-playwright есть только задачи с пользователями и всё открыто.
  const OTHER_SPECS = [
    {
      prefix: 'http-protocol',
      collections: ['tasks', 'users', 'posts', 'comments'],
      nested: true,
      guarded: [['DELETE', '/users/1', 'bearer'], ['POST', '/posts', 'bearer']],
      open: [['GET', '/tasks/1'], ['POST', '/tasks']],
    },
    {
      prefix: 'js-playwright',
      collections: ['tasks', 'users'],
      nested: false,
      guarded: [],
      open: [['GET', '/tasks/1'], ['POST', '/users'], ['DELETE', '/users/1']],
    },
    {
      prefix: 'postman',
      collections: ['tasks', 'users', 'posts', 'comments'],
      nested: true,
      guarded: [['GET', '/tasks/1', 'basic'], ['POST', '/tasks', 'basic'], ['DELETE', '/users/1', 'bearer']],
      open: [['GET', '/tasks'], ['POST', '/users']],
    },
  ];

  const bodyFor = (path) => {
    if (path.startsWith('/tasks')) return { title: 'title', description: 'description' };
    if (path.startsWith('/users')) {
      return { email: 'john@mail.com', firstName: 'John', lastName: 'Doe', password: 'secret' };
    }
    if (path.startsWith('/posts')) return { title: 'title', body: 'body' };
    return { postId: 1, body: 'body' };
  };

  const credentials = {
    bearer: 'Bearer any-value',
    basic: `Basic ${Buffer.from('user:pass').toString('base64')}`,
  };

  for (const spec of OTHER_SPECS) {
    const send = (method, path, scheme) => {
      const headers = {};
      if (scheme) headers.Authorization = credentials[scheme];
      const hasBody = method === 'POST' || method === 'PATCH';
      if (hasBody) headers['Content-Type'] = 'application/json';
      return getJson(`${APP}/${spec.prefix}${path}`, {
        method,
        headers,
        body: hasBody ? JSON.stringify(bodyFor(path)) : undefined,
      });
    };

    const page = await send('GET', '/users?skip=3&limit=2');
    check(
      `${spec.prefix}: skip=3&limit=2 применяются`,
      JSON.stringify(page.body?.users) === JSON.stringify(expectedUsers.slice(3, 5))
        && page.body?.total === expectedUsers.length,
      JSON.stringify(page.body),
    );
    const selected = await send('GET', '/users?select=firstName');
    check(
      `${spec.prefix}: select оставляет id и запрошенное поле`,
      JSON.stringify(Object.keys(selected.body?.users?.[0] ?? {})) === JSON.stringify(['id', 'firstName']),
      JSON.stringify(selected.body?.users?.[0]),
    );
    const third = await send('GET', '/users/3');
    check(
      `${spec.prefix}: /users/3 отдаёт третьего пользователя`,
      JSON.stringify(third.body) === JSON.stringify(expectedUsers[2]),
      JSON.stringify(third.body),
    );
    const missing = await send('GET', '/users/999');
    check(`${spec.prefix}: /users/999 → 404`, missing.status === 404, `получено ${missing.status}`);
    const wrongMethod = await send('DELETE', '/users');
    check(`${spec.prefix}: DELETE по коллекции → 405`, wrongMethod.status === 405, `получено ${wrongMethod.status}`);
    const badRange = await send('GET', '/users?skip=-1');
    check(`${spec.prefix}: отрицательный skip → 422`, badRange.status === 422, `получено ${badRange.status}`);

    for (const name of ['tasks', 'users', 'posts', 'comments']) {
      const declared = spec.collections.includes(name);
      const { status } = await send('GET', `/${name}`);
      check(
        `${spec.prefix}/${name} ${declared ? 'отвечает 200' : 'не объявлена'}`,
        declared ? status === 200 : status === 404,
        `получено ${status}`,
      );
    }

    if (spec.nested) {
      const own = await send('GET', '/users/1/posts');
      check(
        `${spec.prefix}: /users/1/posts отбирает по автору`,
        JSON.stringify(own.body?.posts) === JSON.stringify(expectedPosts.filter((post) => post.authorId === 1)),
        `постов ${own.body?.posts?.length}`,
      );
    }

    for (const [method, path, scheme] of spec.guarded) {
      const without = await send(method, path);
      check(`${spec.prefix}: ${method} ${path} без ${scheme} → 401`, without.status === 401, `получено ${without.status}`);
      const withCreds = await send(method, path, scheme);
      check(`${spec.prefix}: ${method} ${path} с ${scheme} проходит`, withCreds.status < 400, `получено ${withCreds.status}`);
    }

    for (const [method, path] of spec.open) {
      const { status } = await send(method, path);
      check(`${spec.prefix}: ${method} ${path} открыт`, status < 400, `получено ${status}`);
    }

    // Создание везде 201: три спецификации объявляли обычный ответ, и урок
    // api-testing курса Playwright из-за этого не проходил.
    const created = await send('POST', '/users');
    check(`${spec.prefix}: POST /users → 201`, created.status === 201, `получено ${created.status}`);
  }

  console.log('\nЧисла в ответах не выходят за uint16');
  for (const url of [TASKS, `${TASKS}/1`, USERS, `${USERS}/1`, POSTS, `${POSTS}/1`, COMMENTS]) {
    const path = url.replace(APP, '');
    const { body } = await getJson(url, { method: 'GET' });
    const bad = outOfRange(body, path);
    check(`${path} в границах uint16`, bad.length === 0, bad.join(', '));
  }
  const { body: coursesBody } = await getJson(COURSES, { method: 'GET', headers: KEY });
  check('/courses в границах uint16', outOfRange(coursesBody, '/courses').length === 0);

  console.log('\nПримеры спецификации не расходятся с набором задач');
  // Документацию курса читают по спецификации, а данные отдаёт приложение, то
  // есть примеры и набор это две копии. Сверка идёт поиском подстроки: разбирать
  // YAML нечем, отдельная зависимость ради одной проверки того не стоит.
  const spec = readFileSync(SPEC, 'utf8');
  // В примере приведены первые три задачи, а не весь набор: пример это
  // иллюстрация ответа, а не его копия. Сверяется то, что показано, плюс total.
  for (const task of expectedTasks.slice(0, 3)) {
    check(
      `пример задачи ${task.id} есть в спецификации`,
      spec.includes(task.title) && spec.includes(task.description),
      `нет «${task.title}»`,
    );
  }
  check(
    'пример Tasks объявляет реальный total',
    spec.includes(`total: ${expectedTasks.length}`),
    `ожидался total: ${expectedTasks.length}`,
  );
  for (const user of expectedUsers.slice(0, 3)) {
    check(
      `пример пользователя ${user.id} есть в спецификации`,
      spec.includes(user.email) && spec.includes(user.firstName),
      `нет «${user.email}»`,
    );
  }
  for (const post of expectedPosts.slice(0, 3)) {
    check(`пример поста ${post.id} есть в спецификации`, spec.includes(post.title), `нет «${post.title}»`);
  }
  check(
    'пример Posts объявляет реальный total',
    spec.includes(`total: ${expectedPosts.length}`),
    `ожидался total: ${expectedPosts.length}`,
  );
  check(
    'пример Comments объявляет реальный total',
    spec.includes(`total: ${expectedComments.length}`),
    `ожидался total: ${expectedComments.length}`,
  );
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
