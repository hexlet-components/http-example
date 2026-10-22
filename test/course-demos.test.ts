import { setTimeout as wait } from 'node:timers/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, createClient } from './helpers.ts';

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;
let origin: string;
beforeAll(async () => {
  app = await buildApp();
  origin = await app.listen({ host: '127.0.0.1', port: 0 });
  client = createClient(app);
});
afterAll(() => app.close());

describe('Куки и условные запросы', () => {
  it('вход выдаёт куки, которая меняет ответ страницы сессии', async () => {
    expect((await client.send('/http-for-automation/session')).body).toBe('Guest');
    const login = await client.send('/http-for-automation/session', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'username=student',
    });
    expect(login.status).toBe(200);
    expect(login.body).toBe('Session started');
    expect(login.headers['set-cookie']).toContain('session=hexlet-demo');
    expect(login.headers['set-cookie']).toContain('Max-Age=300');
    expect(login.headers['set-cookie']).toContain('HttpOnly; Secure; SameSite=Lax');
    const member = await client.send('/http-for-automation/session', { headers: { cookie: 'session=hexlet-demo' } });
    expect(member.body).toBe('Welcome, student!');
    expect(member.headers['cache-control']).toBe('no-store');
    expect((await client.send('/http-for-automation/session', { method: 'DELETE' })).headers['set-cookie']).toContain(
      'Max-Age=0',
    );
  });
  it('подтверждает версию без тела и отличает no-cache от no-store', async () => {
    const first = await client.send('/http-for-automation/cache');
    expect(first.body).toBe('Office hours: 09:00-18:00');
    expect(first.headers['content-length']).toBe('25');
    expect(first.headers['cache-control']).toBe('private, max-age=60');
    const match = await client.send('/http-for-automation/cache', { headers: { 'if-none-match': first.headers.etag } });
    expect(match.status).toBe(304);
    expect(match.body).toBe('');
    expect(match.headers['content-length']).toBeUndefined();
    expect(
      (await client.send('/http-for-automation/cache', { headers: { 'if-none-match': '"old-version"' } })).status,
    ).toBe(200);
    expect((await client.send('/http-for-automation/cache/revalidate')).headers['cache-control']).toBe('no-cache');
    const noStore = await client.send('/http-for-automation/cache/no-store', {
      headers: { 'if-none-match': first.headers.etag },
    });
    expect(noStore.status).toBe(200);
    expect(noStore.headers['cache-control']).toBe('no-store');
    expect(noStore.headers.etag).toBeUndefined();
  });
});

describe('Доставка вебхука', () => {
  it('требует подписку и делает настоящий HTTP-запрос в отдельный приёмник', async () => {
    const created = await client.json('/http-for-automation/webhooks/inboxes', 'POST');
    const prefix = `/http-for-automation/webhooks/inboxes/${created.body.inbox_id}`;
    expect(created.status).toBe(201);
    expect((await client.json(`${prefix}/trigger`, 'POST')).status).toBe(409);
    const unsafe = await client.json(`${prefix}/subscription`, 'POST', { callback_url: 'http://127.0.0.1/admin' });
    expect(unsafe.status).toBe(422);
    expect(
      (await client.json(`${prefix}/subscription`, 'POST', { callback_url: created.body.callback_url })).status,
    ).toBe(200);
    const delivered = await client.json(`${prefix}/trigger`, 'POST');
    expect(delivered.body).toEqual({ event_id: 'evt-1', receiver_status: 204 });
    const saved = await client.send(`${prefix}/events`);
    expect(saved.body.events).toHaveLength(1);
    expect(saved.body.events[0]).toMatchObject({
      method: 'POST',
      response_status: 204,
      body: { event_id: 'evt-1', type: 'task.created', data: { id: 101, title: 'Check the webhook' } },
    });
    const other = await client.json('/http-for-automation/webhooks/inboxes', 'POST');
    expect(
      (await client.send(`/http-for-automation/webhooks/inboxes/${other.body.inbox_id}/events`)).body.events,
    ).toEqual([]);
  });
  it('отклоняет сообщение без учебного подтверждения источника', async () => {
    const inbox = await client.json('/http-for-automation/webhooks/inboxes', 'POST');
    const denied = await client.json(`/http-for-automation/webhooks/inboxes/${inbox.body.inbox_id}`, 'POST', {
      event_id: 'evt-1',
      type: 'task.created',
      data: { id: 101, title: 'Check the webhook' },
    });
    expect(denied.status).toBe(401);
  });
});

const createRun = async () => {
  const reply = await client.json('/http-for-automation/reliability/runs', 'POST');
  expect(reply.status).toBe(201);
  return `/http-for-automation/reliability/runs/${reply.body.run_id}`;
};

describe('Управляемые сбои HTTP', () => {
  it('временный отказ не затрагивает опыт другого учащегося', async () => {
    const first = await createRun();
    const second = await createRun();
    const refused = await client.send(`${first}/temporary`);
    expect(refused.status).toBe(503);
    expect(refused.headers['retry-after']).toBe('1');
    expect((await client.send(`${first}/temporary`)).status).toBe(200);
    expect((await client.send(`${second}/temporary`)).status).toBe(503);
  });
  it('ограничение частоты снимается после задержки из Retry-After', async () => {
    const prefix = await createRun();
    const refused = await client.send(`${prefix}/limited`);
    expect(refused.status).toBe(429);
    expect(refused.headers['retry-after']).toBe('1');
    expect((await client.send(`${prefix}/limited`)).status).toBe(429);
    await wait(1100);
    expect((await client.send(`${prefix}/limited`)).status).toBe(200);
  });
  it('повтор после обрыва возвращает сохранённую операцию по тому же ключу', async () => {
    const prefix = await createRun();
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'lesson-operation-1' },
      body: JSON.stringify({ title: 'Check the repeat' }),
    };
    await expect(fetch(`${origin}${prefix}/operations?lose_response=1`, options)).rejects.toThrow('fetch failed');
    const repeat = await fetch(`${origin}${prefix}/operations?lose_response=1`, options);
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toEqual({ id: 1, title: 'Check the repeat' });
    expect((await client.send(`${prefix}/operations`)).body.operations).toHaveLength(1);
    const journal = (await client.send(`${prefix}/journal`)).body.journal;
    expect(journal.map((entry: { result: string }) => entry.result)).toEqual(['created', 'reused']);
    expect(
      (
        await client.json(
          `${prefix}/operations`,
          'POST',
          { title: 'Different' },
          {
            'Idempotency-Key': 'lesson-operation-1',
          },
        )
      ).status,
    ).toBe(409);
  });
  it('два запроса без ключа после обрыва создают две операции', async () => {
    const prefix = await createRun();
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title":"Check the repeat"}',
    };
    await expect(fetch(`${origin}${prefix}/operations?lose_response=1`, options)).rejects.toThrow('fetch failed');
    expect((await client.json(`${prefix}/operations`, 'POST', { title: 'Check the repeat' })).status).toBe(201);
    expect((await client.send(`${prefix}/operations`)).body.operations).toHaveLength(2);
  });
  it('прерывание ожидания клиентом не требует HTTP-кода от сервера', async () => {
    const prefix = await createRun();
    await expect(fetch(`${origin}${prefix}/slow`, { signal: AbortSignal.timeout(50) })).rejects.toThrow(/timeout/i);
  });
});
