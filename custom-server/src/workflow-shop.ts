import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyReply } from 'fastify';

const PREFIX = '/workflow-automation';
const SHOP_TTL = 24 * 60 * 60 * 1000;
const MAX_SHOPS = 200;
const MAX_ORDERS = 300;
const BATCH_SIZE = 3;
const products = [
  { sku: 'notebook', title: 'Notebook', price: 350 },
  { sku: 'mug', title: 'Coffee mug', price: 600 },
  { sku: 'headphones', title: 'Headphones', price: 2400 },
  { sku: 'keyboard', title: 'Keyboard', price: 3500 },
  { sku: 'book', title: 'JavaScript handbook', price: 1200 },
];
const statuses = ['paid', 'pending', 'cancelled'] as const;

interface Order {
  id: number;
  created_at: string;
  status: (typeof statuses)[number];
  currency: 'RUB';
  items: { sku: string; title: string; quantity: number; price: number }[];
  total: number;
  processed: boolean;
  processed_at: string | null;
}
interface Shop {
  expires: number;
  orders: Order[];
  failures: Set<string>;
}
interface ShopParams {
  shopId: string;
}
interface OrderParams extends ShopParams {
  orderId: string;
}
interface ListQuery {
  after?: string;
  through?: string;
  limit?: string;
}

function integer(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return NaN;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : NaN;
}

function createOrder(id: number): Order {
  const product = products[(id - 1) % products.length];
  const quantity = ((id - 1) % 3) + 1;
  return {
    id,
    created_at: new Date().toISOString(),
    status: statuses[(id - 1) % statuses.length],
    currency: 'RUB',
    items: [{ ...product, quantity }],
    total: product.price * quantity,
    processed: false,
    processed_at: null,
  };
}

export default async function setUpWorkflowShop(app: FastifyInstance) {
  // Магазины и заказы принадлежат только этому курсу. Другие префиксы их не используют.
  const shops = new Map<string, Shop>();

  function findShop(id: string, reply: FastifyReply) {
    const shop = shops.get(id);
    if (shop && shop.expires > Date.now()) return shop;
    shops.delete(id);
    reply.code(404).send({ error: 'shop_not_found', message: 'Create a new shop to continue.' });
    return undefined;
  }

  app.addHook('onSend', async (request, reply) => {
    if (request.url === PREFIX || request.url.startsWith(`${PREFIX}/`)) reply.header('Cache-Control', 'no-store');
  });

  app.get(PREFIX, (_request, reply) => reply.sendFile('workflow-automation/index.html'));

  app.post(`${PREFIX}/shops`, (_request, reply) => {
    const now = Date.now();
    for (const [id, shop] of shops) if (shop.expires <= now) shops.delete(id);
    if (shops.size >= MAX_SHOPS) return reply.code(503).send({ error: 'shop_capacity_reached' });
    const id = randomBytes(12).toString('hex');
    const expires = now + SHOP_TTL;
    shops.set(id, { expires, orders: [], failures: new Set() });
    return reply.code(201).send({
      shop_id: id,
      orders_url: `${PREFIX}/shops/${id}/orders`,
      expires_at: new Date(expires).toISOString(),
    });
  });

  app.get<{ Params: ShopParams; Querystring: ListQuery }>(`${PREFIX}/shops/:shopId/orders`, (request, reply) => {
    const shop = findShop(request.params.shopId, reply);
    if (!shop) return reply;
    const after = integer(request.query.after, 0);
    const limit = integer(request.query.limit, 10);
    const through = integer(request.query.through, shop.orders.length + BATCH_SIZE);
    if (
      !Number.isFinite(after) ||
      !Number.isFinite(through) ||
      !Number.isFinite(limit) ||
      limit < 1 ||
      limit > 100 ||
      after > shop.orders.length ||
      after > through ||
      (request.query.through !== undefined && through > shop.orders.length)
    ) {
      return reply.code(422).send({ error: 'invalid_cursor', message: 'Use after, through and limit from this shop.' });
    }
    // Новый опрос добавляет заказы. Все страницы одного опроса используют through,
    // чтобы генерация не превращала обход списка в бесконечный цикл.
    if (request.query.through === undefined) {
      if (shop.orders.length + BATCH_SIZE > MAX_ORDERS) {
        return reply.code(429).send({ error: 'order_limit_reached', message: 'Create a new shop to continue.' });
      }
      for (let i = 0; i < BATCH_SIZE; i++) shop.orders.push(createOrder(shop.orders.length + 1));
    }
    const orders = shop.orders.slice(after, Math.min(after + limit, through));
    const nextAfter = orders.at(-1)?.id ?? after;
    return {
      orders,
      next_after: nextAfter,
      through,
      has_more: nextAfter < through,
    };
  });

  app.get<{ Params: OrderParams }>(`${PREFIX}/shops/:shopId/orders/:orderId`, (request, reply) => {
    const shop = findShop(request.params.shopId, reply);
    if (!shop) return reply;
    const id = integer(request.params.orderId, NaN);
    const order = shop.orders[id - 1];
    if (!order) return reply.code(404).send({ error: 'order_not_found' });
    return order;
  });

  app.post<{ Params: OrderParams; Querystring: { failure?: string } }>(
    `${PREFIX}/shops/:shopId/orders/:orderId/process`,
    (request, reply) => {
      const shop = findShop(request.params.shopId, reply);
      if (!shop) return reply;
      const id = integer(request.params.orderId, NaN);
      const order = shop.orders[id - 1];
      if (!order) return reply.code(404).send({ error: 'order_not_found' });
      const failure = request.query.failure;
      if (failure !== undefined && failure !== 'before' && failure !== 'after') {
        return reply.code(422).send({ error: 'invalid_failure' });
      }
      if (order.status !== 'paid') return reply.code(409).send({ error: 'order_not_paid' });
      if (order.processed) return order;
      const failureKey = `${id}:${failure}`;
      const shouldFail = failure !== undefined && !shop.failures.has(failureKey);
      if (shouldFail) shop.failures.add(failureKey);
      if (shouldFail && failure === 'before') {
        return reply.code(503).header('Retry-After', '1').send({ error: 'temporarily_unavailable' });
      }
      order.processed = true;
      order.processed_at = new Date().toISOString();
      if (shouldFail && failure === 'after') {
        return reply.code(503).header('Retry-After', '1').send({ error: 'processing_result_unavailable' });
      }
      return order;
    },
  );
}
