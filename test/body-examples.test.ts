import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp, createClient } from './helpers.ts';

const fields = { title: 'Check the automation task', description: 'Review the test request' };

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

describe('Форматы тела учебных запросов', () => {
  it('форма доступна и задаёт имена обоих полей', async () => {
    const page = await client.send('/http-protocol/form');
    expect(page.status).toBe(200);
    expect(page.body).toContain('name="title"');
    expect(page.body).toContain('name="description"');
  });

  it('браузерная форма возвращает прочитанные значения', async () => {
    const reply = await client.send('/http-protocol/form', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams(fields).toString(),
    });
    expect(reply.status).toBe(200);
    expect(reply.body).toBe(`title=${fields.title}\ndescription=${fields.description}\n`);
  });

  it('JSON сохраняет типы и отражает заголовки', async () => {
    const reply = await client.json(
      '/http-protocol/body',
      'POST',
      { ...fields, priority: 2, urgent: false },
      { Accept: 'application/json' },
    );
    expect(reply.status).toBe(200);
    expect(reply.body.json.priority).toBe(2);
    expect(reply.body.json.urgent).toBe(false);
    expect(reply.body.headers.Accept).toBe('application/json');
  });

  it('кодированные поля декодируются с пробелами', async () => {
    const reply = await client.send('/http-protocol/body', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams(fields).toString(),
    });
    expect(reply.status).toBe(200);
    expect(reply.body.form.title).toBe(fields.title);
    expect(reply.body.json).toBeNull();
  });

  it('multipart передаёт содержимое файла и текстовое поле', async () => {
    const body = new FormData();
    body.set('title', fields.title);
    body.set(
      'attachment',
      new Blob(['Please check the automation task\n'], { type: 'text/plain' }),
      'http-body-note.txt',
    );
    const response = await app.inject({
      url: '/http-protocol/body',
      method: 'POST',
      payload: body,
    });
    const reply = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(reply.form.title).toBe(fields.title);
    expect(reply.files.attachment).toBe('Please check the automation task\n');
    expect(reply.headers['Content-Type']).toContain('boundary=');
  });

  it('PNG имеет заявленный размер и сигнатуру', async () => {
    const response = await app.inject({ url: '/http-protocol/image.png' });
    const data = response.rawPayload;
    expect(response.statusCode).toBe(200);
    expect(String(response.headers['content-type'])).toMatch(/^image\/png/);
    expect(Number(response.headers['content-length'])).toBe(data.length);
    expect(data.length).toBe(8090);
    expect([...data.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});
