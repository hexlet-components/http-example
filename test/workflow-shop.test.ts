import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, createClient } from './helpers.ts';

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});
afterAll(() => app.close());

async function createShop() {
  const created = await client.json('/workflow-automation/shops', 'POST');
  expect(created.status).toBe(201);
  expect(created.headers['cache-control']).toBe('no-store');
  return created.body.orders_url as string;
}

describe('Магазин курса автоматизации рабочих процессов', () => {
  it('новый опрос создаёт новые заказы, чтение заказа сохраняет его содержимое', async () => {
    const url = await createShop();
    const first = await client.send(url);
    expect(first.body.orders.map((order: { id: number }) => order.id)).toEqual([1, 2, 3]);
    expect(first.body).toMatchObject({ next_after: 3, through: 3, has_more: false });
    expect(first.headers['cache-control']).toBe('no-store');
    for (const order of first.body.orders) {
      expect(order.total).toBe(
        order.items.reduce(
          (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
          0,
        ),
      );
      expect((await client.send(`${url}/${order.id}`)).body).toEqual(order);
    }
    const next = await client.send(`${url}?after=${first.body.next_after}`);
    expect(next.body.orders.map((order: { id: number }) => order.id)).toEqual([4, 5, 6]);
    expect(next.body).toMatchObject({ next_after: 6, through: 6, has_more: false });
    expect((await client.send(`${url}/1`)).body).toEqual(first.body.orders[0]);
    expect((await client.send(`${url}?through=3`)).body).toEqual(first.body);
  });

  it('страницы ограничены through, повтор страницы не создаёт заказы и обход завершается', async () => {
    const url = await createShop();
    const first = await client.send(`${url}?limit=1`);
    expect(first.body).toMatchObject({ next_after: 1, through: 3, has_more: true });
    const secondUrl = `${url}?limit=1&after=1&through=3`;
    const second = await client.send(secondUrl);
    expect(second.body.orders.map((order: { id: number }) => order.id)).toEqual([2]);
    expect((await client.send(secondUrl)).body).toEqual(second.body);
    const third = await client.send(`${url}?limit=1&after=2&through=3`);
    expect(third.body).toMatchObject({ next_after: 3, through: 3, has_more: false });
    expect((await client.send(`${url}?after=3&through=3`)).body.orders).toEqual([]);
    expect((await client.send(`${url}?after=3`)).body.through).toBe(6);
  });

  it('магазины изолируют генерацию и подтверждения', async () => {
    const first = await createShop();
    const second = await createShop();
    expect(first).not.toBe(second);
    await client.send(first);
    expect((await client.send(`${second}/1`)).status).toBe(404);
    await client.send(second);
    await client.json(`${first}/1/process`, 'POST');
    expect((await client.send(`${first}/1`)).body.processed).toBe(true);
    expect((await client.send(`${second}/1`)).body.processed).toBe(false);
    expect((await client.send(`${second}?after=3`)).body.through).toBe(6);
    expect((await client.send(`${first}/4`)).status).toBe(404);
  });

  it('подтверждение оплаченного заказа идемпотентно', async () => {
    const url = await createShop();
    await client.send(url);
    const first = await client.json(`${url}/1/process`, 'POST');
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ id: 1, status: 'paid', processed: true });
    expect(first.body.processed_at).toEqual(expect.any(String));
    const repeated = await client.json(`${url}/1/process`, 'POST');
    expect(repeated.status).toBe(200);
    expect(repeated.body).toEqual(first.body);
    expect((await client.send(`${url}/1`)).body).toEqual(first.body);
  });

  it('различает отказ до обработки и потерю результата после обработки', async () => {
    const url = await createShop();
    await client.send(url);
    const failed = await client.json(`${url}/1/process?failure=before`, 'POST');
    expect(failed.status).toBe(503);
    expect(failed.headers['retry-after']).toBe('1');
    expect((await client.send(`${url}/1`)).body.processed).toBe(false);
    expect((await client.json(`${url}/1/process?failure=before`, 'POST')).status).toBe(200);
    await client.send(`${url}?after=3`);
    expect((await client.json(`${url}/4/process?failure=after`, 'POST')).status).toBe(503);
    const saved = await client.send(`${url}/4`);
    expect(saved.body.processed).toBe(true);
    expect((await client.json(`${url}/4/process?failure=after`, 'POST')).body).toEqual(saved.body);
  });

  it('проверяет оплату, существование заказа и параметры отказа', async () => {
    const url = await createShop();
    await client.send(url);
    for (const id of [2, 3]) expect((await client.json(`${url}/${id}/process`, 'POST')).status).toBe(409);
    expect((await client.json(`${url}/999/process`, 'POST')).status).toBe(404);
    expect((await client.send(`${url}/1.5`)).status).toBe(404);
    expect((await client.json(`${url}/1/process?failure=invalid`, 'POST')).status).toBe(422);
    expect((await client.send(`${url}/1`)).body.processed).toBe(false);
    expect((await client.send('/workflow-automation/shops/unknown/orders')).status).toBe(404);
  });

  it.each(['after=-1', 'after=1.5', 'after=999', 'through=1', 'limit=0', 'limit=101', 'limit=abc'])(
    'не генерирует заказы при неверном запросе %s',
    async (query) => {
      const url = await createShop();
      expect((await client.send(`${url}?${query}`)).status).toBe(422);
      expect((await client.send(`${url}/1`)).status).toBe(404);
      expect((await client.send(url)).body.through).toBe(3);
    },
  );

  it('по достижении лимита сохраняет чтение и обработку уже созданных заказов', async () => {
    const url = await createShop();
    for (let after = 0; after < 300; after += 3) {
      const page = await client.send(`${url}?after=${after}`);
      expect(page.status).toBe(200);
    }
    expect((await client.send(`${url}?after=300`)).status).toBe(429);
    expect((await client.send(`${url}?after=299&through=300`)).body.orders[0].id).toBe(300);
    expect((await client.json(`${url}/1/process`, 'POST')).status).toBe(200);
  });

  it('удаляет магазин после срока жизни', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const url = await createShop();
      vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
      expect((await client.send(url)).status).toBe(404);
      expect((await client.json(`${url}/1/process`, 'POST')).status).toBe(404);
      expect((await client.json('/workflow-automation/shops', 'POST')).status).toBe(201);
    } finally {
      vi.useRealTimers();
    }
  });
});
