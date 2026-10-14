import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import expectedComments from '../custom-server/src/data/comments.ts';
import expectedCourses from '../custom-server/src/data/courses.ts';
import expectedPosts from '../custom-server/src/data/posts.ts';
import expectedTasks from '../custom-server/src/data/tasks.ts';
import expectedUsers from '../custom-server/src/data/users.ts';
import { buildApp, createClient, outOfRange } from './helpers.ts';

const API = '/http-api';
const TASKS = `${API}/tasks`;
const USERS = `${API}/users`;
const POSTS = `${API}/posts`;
const COMMENTS = `${API}/comments`;
const COURSES = `${API}/courses`;
const KEY = { 'X-API-KEY': 'any-value' };

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

describe('REST и RPC отдают одни и те же задачи', () => {
  it('GET /tasks отдаёт набор из data/tasks', async () => {
    const list = await client.send(TASKS);
    expect(list.status).toBe(200);
    expect(list.body.tasks).toEqual(expectedTasks);
    expect(list.body.total).toBe(expectedTasks.length);
  });

  it('tasks.list отдаёт тот же набор, что REST', async () => {
    const rest = await client.send(TASKS);
    const rpc = await client.rpc('tasks.list', {});
    expect(rpc.body.result.tasks).toEqual(rest.body.tasks);
  });

  it.each(expectedTasks.map((task) => [task.id, task] as const))(
    'задача %i отбирается по пути, RPC совпадает с REST',
    async (id, task) => {
      const one = await client.send(`${TASKS}/${id}`);
      const viaRpc = await client.rpc('tasks.get', { id });
      expect(one.body).toEqual(task);
      expect(viaRpc.body.result).toEqual(one.body);
    },
  );

  it('GET /tasks/999 отвечает 404', async () => {
    expect((await client.send(`${TASKS}/999`)).status).toBe(404);
  });
});

describe('skip и limit применяются', () => {
  it.each([
    ['limit=2 отдаёт первые две', { skip: 0, limit: 2 }, expectedTasks.slice(0, 2)],
    ['skip=1 пропускает первую', { skip: 1, limit: 30 }, expectedTasks.slice(1)],
    ['skip=1&limit=1 отдаёт вторую', { skip: 1, limit: 1 }, expectedTasks.slice(1, 2)],
    ['skip за концом набора отдаёт пусто', { skip: 99, limit: 10 }, []],
  ])('%s', async (_name, query, expected) => {
    const page = await client.send(`${TASKS}?${new URLSearchParams(query as any)}`);
    expect(page.body.tasks).toEqual(expected);
    expect(page.body.total).toBe(expectedTasks.length);
  });

  it('tasks.list со skip и limit совпадает с REST', async () => {
    const rpc = await client.rpc('tasks.list', { skip: 1, limit: 1 });
    expect(rpc.body.result.tasks).toEqual(expectedTasks.slice(1, 2));
  });

  it('отрицательный skip отвечает 422', async () => {
    expect((await client.send(`${TASKS}?skip=-1`)).status).toBe(422);
  });

  // Запрос из тикета FEEDBACK-166: параметры возвращаются из запроса, а список
  // начинается с шестой задачи.
  it('?skip=5&limit=10 возвращает skip и limit и десять задач с шестой', async () => {
    const asked = await client.send(`${TASKS}?skip=5&limit=10`);
    expect(asked.body.skip).toBe(5);
    expect(asked.body.limit).toBe(10);
    expect(asked.body.tasks).toEqual(expectedTasks.slice(5, 15));
  });
});

describe('Коллекции: пагинация, select и вложенные ресурсы', () => {
  // Урок example печатает ровно этот ответ.
  it('/users?skip=30 отдаёт пустую страницу с total 10', async () => {
    const reply = await client.send(`${USERS}?skip=30`);
    expect(reply.body).toEqual({
      users: [], total: expectedUsers.length, skip: 30, limit: 30,
    });
  });

  it('/posts?skip=30 отдаёт последнюю страницу и полный total', async () => {
    const reply = await client.send(`${POSTS}?skip=30`);
    expect(reply.body.posts).toEqual(expectedPosts.slice(30));
    expect(reply.body.total).toBe(expectedPosts.length);
  });

  it('select оставляет только запрошенные поля и id', async () => {
    const reply = await client.send(`${USERS}?select=firstName,email`);
    expect(Object.keys(reply.body.users[0]).sort()).toEqual(['email', 'firstName', 'id']);
  });

  it('select работает и на одиночном ресурсе', async () => {
    const reply = await client.send(`${USERS}/1?select=lastName`);
    expect(Object.keys(reply.body).sort()).toEqual(['id', 'lastName']);
  });

  it('/users/1/posts отдаёт только посты автора 1 и не совпадает с /posts', async () => {
    const own = await client.send(`${USERS}/1/posts`);
    expect(own.body.posts).toEqual(expectedPosts.filter((post) => post.authorId === 1));
    expect(own.body).not.toEqual((await client.send(POSTS)).body);
  });

  it('/posts/1/comments отдаёт только комментарии этого поста', async () => {
    const reply = await client.send(`${POSTS}/1/comments`);
    expect(reply.body.comments).toEqual(expectedComments.filter((c) => c.postId === 1));
  });

  it('/users/999/posts → 404', async () => {
    expect((await client.send(`${USERS}/999/posts`)).status).toBe(404);
  });

  it('/courses?skip=1&limit=2 применяет параметры', async () => {
    const reply = await client.send(`${COURSES}?skip=1&limit=2`, { headers: KEY });
    expect(reply.body).toEqual({
      courses: expectedCourses.slice(1, 3), total: expectedCourses.length, skip: 1, limit: 2,
    });
  });
});

describe('Отсутствующая запись и авторизация по коллекциям', () => {
  it.each([['users', USERS], ['posts', POSTS], ['comments', COMMENTS]])(
    'GET /%s/999 → 404',
    async (_name, url) => {
      expect((await client.send(`${url}/999`)).status).toBe(404);
    },
  );

  // Спецификация закрывает Bearer'ом изменение постов, комментариев и
  // пользователей, а создание пользователя оставляет открытым.
  it.each([
    ['PATCH /users/1', `${USERS}/1`, 'PATCH'],
    ['DELETE /users/1', `${USERS}/1`, 'DELETE'],
    ['PATCH /posts/1', `${POSTS}/1`, 'PATCH'],
    ['DELETE /comments/1', `${COMMENTS}/1`, 'DELETE'],
  ] as const)('%s без токена → 401', async (_name, url, method) => {
    // Content-Type только вместе с телом: fastify отвечает 400 на пустое тело
    // при заявленном application/json, и проверка мерила бы не то.
    const reply = method === 'PATCH'
      ? await client.json(url, method, { title: 'x', body: 'y', firstName: 'z' })
      : await client.json(url, method);
    expect(reply.status).toBe(401);
  });

  it('POST /users без токена → 201, пароля в ответе нет', async () => {
    const created = await client.json(USERS, 'POST', {
      email: 'john@mail.com', firstName: 'John', lastName: 'Doe', password: 'secret',
    });
    expect(created.status).toBe(201);
    expect(created.body).not.toHaveProperty('password');
  });

  // Урок httpie показывает отправку формы (`http -f`), а тело разбирает
  // @fastify/formbody и проверяет схема.
  it('POST /users формой → 201', async () => {
    const form = await client.send(USERS, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'email=john@mail.com&firstName=John&lastName=Doe&password=secret',
    });
    expect(form.status).toBe(201);
    expect(form.body.firstName).toBe('John');
  });
});

describe('RPC держит ошибки в теле, а код оставляет успешным', () => {
  it('несуществующая задача: код 200 и error', async () => {
    const reply = await client.rpc('tasks.get', { id: 999 });
    expect(reply.status).toBe(200);
    expect(reply.body.error).toBeTruthy();
  });

  it('несуществующий метод: код 200 и -32601', async () => {
    const reply = await client.rpc('tasks.destroy', { id: 1 });
    expect(reply.status).toBe(200);
    expect(reply.body.error.code).toBe(-32601);
  });
});

describe('Коды ответов, на них построены самостоятельные', () => {
  it('GET /nosuch → 404', async () => {
    expect((await client.send(`${API}/nosuch`)).status).toBe(404);
  });

  it('DELETE /tasks → 405 с заголовком Allow', async () => {
    const reply = await client.send(TASKS, { method: 'DELETE' });
    expect(reply.status).toBe(405);
    expect(String(reply.headers.allow ?? '')).toContain('GET');
  });

  it('POST /tasks с пустым телом → 422', async () => {
    expect((await client.json(TASKS, 'POST', {})).status).toBe(422);
  });

  it('DELETE /tasks/1 → 204', async () => {
    expect((await client.send(`${TASKS}/1`, { method: 'DELETE' })).status).toBe(204);
  });

  it('POST /posts без токена → 401', async () => {
    expect((await client.json(POSTS, 'POST', { title: 'title', body: 'body' })).status).toBe(401);
  });

  it('GET /courses без ключа → 401, с ключом → 200', async () => {
    expect((await client.send(COURSES)).status).toBe(401);
    expect((await client.send(COURSES, { headers: KEY })).status).toBe(200);
  });

  it('POST /tasks с телом → 201, статус Backlog, набор не меняется', async () => {
    const created = await client.json(TASKS, 'POST', { title: 'Новая задача', description: 'Описание' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('Backlog');
    // Сервер учебный, и мутации сделали бы уроки невоспроизводимыми.
    expect((await client.send(TASKS)).body.tasks).toEqual(expectedTasks);
  });

  it('POST /posts с токеном → 201 и authorId от сервера', async () => {
    const created = await client.json(
      POSTS, 'POST', { title: 'title', body: 'body' }, { Authorization: 'Bearer any-value' },
    );
    expect(created.status).toBe(201);
    expect(Number.isInteger(created.body.authorId)).toBe(true);
  });

  it('POST /login отдаёт непустой token', async () => {
    const login = await client.json(`${API}/login`, 'POST', { email: 'max@hotmail.com', password: 'password' });
    expect(typeof login.body.token).toBe('string');
    expect(login.body.token.length).toBeGreaterThan(0);
  });

  // Урок kinds просит записать три разных кода. Совпадение любых двух делает
  // задание бессмысленным.
  it('три неудачных запроса из урока kinds дают три разных кода', async () => {
    const codes = [
      (await client.send(`${API}/nosuch`)).status,
      (await client.send(TASKS, { method: 'DELETE' })).status,
      (await client.json(TASKS, 'POST', {})).status,
    ];
    expect(new Set(codes).size).toBe(3);
  });
});

describe('Числа в ответах не выходят за uint16', () => {
  it.each([
    [TASKS], [`${TASKS}/1`], [USERS], [`${USERS}/1`], [POSTS], [`${POSTS}/1`], [COMMENTS],
  ])('%s', async (url) => {
    expect(outOfRange((await client.send(url)).body, url)).toEqual([]);
  });

  it(COURSES, async () => {
    expect(outOfRange((await client.send(COURSES, { headers: KEY })).body, COURSES)).toEqual([]);
  });
});
