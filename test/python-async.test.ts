import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp, createClient } from './helpers.ts';

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

const prefix = '/python-async';

describe('/python-async/books', () => {
  it.each([
    [1, 'Python'],
    [2, 'Asyncio'],
  ])('книга %i → 200 с названием %s', async (id, title) => {
    const reply = await client.send(`${prefix}/books/${id}`);
    expect(reply.status).toBe(200);
    expect(String(reply.headers['content-type'])).toContain('application/json');
    expect(reply.body).toEqual({ id, title });
  });

  it.each(['99', 'abc', '0', '1.5'])('книга %s → 404', async (id) => {
    const reply = await client.send(`${prefix}/books/${id}`);
    expect(reply.status).toBe(404);
    expect(String(reply.headers['content-type'])).toContain('application/json');
    expect(reply.body).toEqual({ error: 'Book not found' });
  });

  // 405 даёт fastify-allow, как и у остальных ручных маршрутов.
  it('POST → 405 с Allow и набор не меняется', async () => {
    const reply = await client.json(`${prefix}/books/1`, 'POST', { title: 'Other' });
    expect(reply.status).toBe(405);
    expect(String(reply.headers.allow)).toContain('GET');
    expect((await client.send(`${prefix}/books/1`)).body).toEqual({ id: 1, title: 'Python' });
  });

  // В текстах курсов адрес пишется без слеша.
  it('трейлинг-слеш → 404', async () => {
    expect((await client.send(`${prefix}/books/1/`)).status).toBe(404);
  });
});

describe('страница /python-async', () => {
  it('ведёт на три адреса книг', async () => {
    const reply = await client.send(prefix);
    expect(reply.status).toBe(200);
    for (const id of [1, 2, 99]) {
      expect(reply.body).toContain(`href="${prefix}/books/${id}"`);
    }
  });
});
