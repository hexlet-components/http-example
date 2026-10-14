import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import expectedPosts from '../custom-server/src/data/posts.ts';
import expectedUsers from '../custom-server/src/data/users.ts';
import { buildApp, createClient } from './helpers.ts';

// Ожидания выписаны здесь заново, а не взяты из кода: тест утверждает поведение
// спецификаций. Матрица снята с typespec/<app>/services/, и различия в ней
// настоящие: задачи курса Postman закрыты Basic, включая чтение одной задачи, а
// у js-playwright есть только задачи с пользователями и всё открыто.
type Scheme = 'bearer' | 'basic';
type Call = [method: string, path: string, scheme?: Scheme];

const SPECS: {
  prefix: string;
  collections: string[];
  nested: boolean;
  guarded: Call[];
  open: Call[];
}[] = [
  {
    prefix: 'http-protocol',
    collections: ['tasks', 'users', 'posts', 'comments'],
    nested: true,
    guarded: [
      ['DELETE', '/users/1', 'bearer'],
      ['POST', '/posts', 'bearer'],
    ],
    open: [
      ['GET', '/tasks/1'],
      ['POST', '/tasks'],
    ],
  },
  {
    prefix: 'js-playwright',
    collections: ['tasks', 'users'],
    nested: false,
    guarded: [],
    open: [
      ['GET', '/tasks/1'],
      ['POST', '/users'],
      ['DELETE', '/users/1'],
    ],
  },
  {
    prefix: 'postman',
    collections: ['tasks', 'users', 'posts', 'comments'],
    nested: true,
    guarded: [
      ['GET', '/tasks/1', 'basic'],
      ['POST', '/tasks', 'basic'],
      ['DELETE', '/users/1', 'bearer'],
    ],
    open: [
      ['GET', '/tasks'],
      ['POST', '/users'],
    ],
  },
];

const bodyFor = (path: string) => {
  if (path.startsWith('/tasks')) return { title: 'title', description: 'description' };
  if (path.startsWith('/users')) {
    return { email: 'john@mail.com', firstName: 'John', lastName: 'Doe', password: 'secret' };
  }
  if (path.startsWith('/posts')) return { title: 'title', body: 'body' };
  return { postId: 1, body: 'body' };
};

const credentials: Record<Scheme, string> = {
  bearer: 'Bearer any-value',
  basic: `Basic ${Buffer.from('user:pass').toString('base64')}`,
};

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

describe.each(SPECS)('$prefix', (spec) => {
  const send = (method: string, path: string, scheme?: Scheme) => {
    const hasBody = method === 'POST' || method === 'PATCH';
    return client.json(
      `/${spec.prefix}${path}`,
      method as any,
      hasBody ? bodyFor(path) : undefined,
      scheme ? { Authorization: credentials[scheme] } : {},
    );
  };

  it('skip=3&limit=2 применяются', async () => {
    const page = await send('GET', '/users?skip=3&limit=2');
    expect(page.body.users).toEqual(expectedUsers.slice(3, 5));
    expect(page.body.total).toBe(expectedUsers.length);
  });

  it('select оставляет id и запрошенное поле', async () => {
    const selected = await send('GET', '/users?select=firstName');
    expect(Object.keys(selected.body.users[0])).toEqual(['id', 'firstName']);
  });

  it('/users/3 отдаёт третьего пользователя', async () => {
    expect((await send('GET', '/users/3')).body).toEqual(expectedUsers[2]);
  });

  it('/users/999 → 404', async () => {
    expect((await send('GET', '/users/999')).status).toBe(404);
  });

  it('DELETE по коллекции → 405', async () => {
    expect((await send('DELETE', '/users')).status).toBe(405);
  });

  it('отрицательный skip → 422', async () => {
    expect((await send('GET', '/users?skip=-1')).status).toBe(422);
  });

  it.each(['tasks', 'users', 'posts', 'comments'])('/%s', async (name) => {
    const { status } = await send('GET', `/${name}`);
    expect(status).toBe(spec.collections.includes(name) ? 200 : 404);
  });

  it.runIf(spec.nested)('/users/1/posts отбирает по автору', async () => {
    const own = await send('GET', '/users/1/posts');
    expect(own.body.posts).toEqual(expectedPosts.filter((post) => post.authorId === 1));
  });

  it.each(spec.guarded)('%s %s закрыт: без учётных данных 401, с ними проходит', async (method, path, scheme) => {
    expect((await send(method, path)).status).toBe(401);
    expect((await send(method, path, scheme)).status).toBeLessThan(400);
  });

  it.each(spec.open)('%s %s открыт', async (method, path) => {
    expect((await send(method, path)).status).toBeLessThan(400);
  });

  // Создание везде 201: три спецификации объявляли обычный ответ, и урок
  // api-testing курса Playwright из-за этого не проходил.
  it('POST /users → 201', async () => {
    expect((await send('POST', '/users')).status).toBe(201);
  });
});
