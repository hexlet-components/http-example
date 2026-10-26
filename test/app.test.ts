import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import appConfig from '../app.config.json' with { type: 'json' };
import plugin from '../custom-server/src/index.ts';
import { buildApp, createClient } from './helpers.ts';

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

describe('контракт с fastify-cli', () => {
  // fastify-cli отвергает async-плагин с одним аргументом, и приложение тогда не
  // стартует вовсе.
  it('плагин принимает два аргумента', () => {
    expect(plugin.length).toBe(2);
  });
});

describe('документация и статика', () => {
  it.each(appConfig.apps)('/%s-openapi отдаёт swagger-ui', async (name) => {
    const reply = await client.send(`/${name}-${appConfig.docRoute}`);
    expect(reply.status).toBe(200);
    expect(String(reply.headers['content-type'])).toContain('text/html');
  });

  it('главная страница отдаётся', async () => {
    expect((await client.send('/')).status).toBe(200);
  });

  it.each(['/', '/http-for-automation'])('ссылки со страницы %s живые', async (page) => {
    const html = String((await client.send(page)).body);
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect({ link, status: (await client.send(link)).status }).not.toEqual({ link, status: 404 });
    }
  });

  it('несуществующий адрес → 404 с кодом в теле', async () => {
    const reply = await client.send('/nosuch');
    expect(reply.status).toBe(404);
    expect(reply.body.code).toBe(404);
  });

  // В текстах курсов адрес пишется без слеша.
  it('трейлинг-слеш у коллекции → 404', async () => {
    expect((await client.send('/postman/users/')).status).toBe(404);
  });
});

describe('протокольные примеры', () => {
  it('/http-protocol/example отдаёт Done! и куки', async () => {
    const reply = await client.send('/http-protocol/example');
    expect(reply.status).toBe(200);
    expect(reply.body).toBe('Done!');
    expect(reply.headers['set-cookie']).toHaveLength(2);
  });

  it('/http-protocol/removed → 301', async () => {
    const reply = await client.send('/http-protocol/removed');
    expect(reply.status).toBe(301);
    expect(reply.headers.location).toBe('/http-protocol/example');
  });

  it('/postman/cookie ставит куку', async () => {
    const reply = await client.send('/postman/cookie');
    expect(String(reply.headers['set-cookie'])).toContain('myCookie=cookieValue');
  });

  it('/http-api/echo отражает тело', async () => {
    const reply = await client.json('/http-api/echo', 'POST', { a: 1 });
    expect(reply.body).toEqual({ a: 1 });
  });

  it('/http-protocol/stream отдаёт пять чанков', async () => {
    const reply = await client.send('/http-protocol/stream');
    expect(reply.body).toBe('Chunk 1\nChunk 2\nChunk 3\nChunk 4\nChunk 5\n');
  }, 10000);
});
