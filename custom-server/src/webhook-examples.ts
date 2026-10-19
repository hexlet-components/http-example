import type { FastifyInstance } from 'fastify';
import { createDemoStore, DEMO_ORIGIN } from './demo-store.ts';
import type { DemoParams } from './demo-store.ts';

interface Event {
  event_id: string;
  type: string;
  data: { id: number; title: string };
}
interface Inbox {
  subscribed: boolean;
  delivering: boolean;
  nextEvent: number;
  events: { method: string; headers: Record<string, string>; body: Event; response_status: number }[];
}

export default async function setUpWebhookExamples(app: FastifyInstance) {
  const inboxes = createDemoStore<Inbox>();
  const prefix = '/http-protocol/webhooks/inboxes';
  app.post(prefix, (_request, reply) => {
    const id = inboxes.create({ subscribed: false, delivering: false, nextEvent: 1, events: [] });
    if (!id) return reply.code(503).send({ error: 'demo_capacity_reached' });
    return reply
      .code(201)
      .header('Cache-Control', 'no-store')
      .send({
        inbox_id: id,
        callback_url: `${DEMO_ORIGIN}${prefix}/${id}`,
        events_url: `${DEMO_ORIGIN}${prefix}/${id}/events`,
      });
  });
  app.post<{ Params: DemoParams; Body: { callback_url?: string } }>(`${prefix}/:id/subscription`, (request, reply) => {
    const inbox = inboxes.get(request.params.id);
    if (!inbox) return reply.code(404).send({ error: 'demo_not_found' });
    const callback = `${DEMO_ORIGIN}${prefix}/${request.params.id}`;
    // Приёмник выбирается из созданного опыта. Произвольные внешние адреса стенд
    // не вызывает, иначе учебная подписка позволяла бы обращаться во внутреннюю сеть.
    if (request.body?.callback_url !== callback) return reply.code(422).send({ error: 'use_the_inbox_callback_url' });
    inbox.subscribed = true;
    return { event: 'task.created', callback_url: callback };
  });
  app.get<{ Params: DemoParams }>(`${prefix}/:id/events`, (request, reply) => {
    const inbox = inboxes.get(request.params.id);
    if (!inbox) return reply.code(404).send({ error: 'demo_not_found' });
    return reply.header('Cache-Control', 'no-store').send({ events: inbox.events });
  });
  app.post<{ Params: DemoParams; Body: Event }>(`${prefix}/:id`, (request, reply) => {
    const inbox = inboxes.get(request.params.id);
    if (!inbox) return reply.code(404).send({ error: 'demo_not_found' });
    if (request.headers['x-webhook-key'] !== 'hexlet-demo-webhook')
      return reply.code(401).send({ error: 'invalid_webhook_key' });
    const event = request.body;
    if (
      !event ||
      typeof event.event_id !== 'string' ||
      !event.event_id.trim() ||
      event.event_id.length > 80 ||
      event.type !== 'task.created' ||
      !event.data ||
      typeof event.data.title !== 'string' ||
      event.data.title.length > 120 ||
      !Number.isInteger(event.data.id) ||
      event.data.id < 1 ||
      (request.headers['content-type']?.length ?? 0) > 200
    ) {
      return reply.code(422).send({ error: 'invalid_event' });
    }
    inbox.events.push({
      method: 'POST',
      headers: {
        'content-type': request.headers['content-type'] ?? '',
        'x-webhook-key': 'hexlet-demo-webhook',
      },
      body: { event_id: event.event_id, type: event.type, data: { id: event.data.id, title: event.data.title } },
      response_status: 204,
    });
    if (inbox.events.length > 30) inbox.events.shift();
    return reply.code(204).send();
  });
  app.post<{ Params: DemoParams }>(`${prefix}/:id/trigger`, async (request, reply) => {
    const inbox = inboxes.get(request.params.id);
    if (!inbox) return reply.code(404).send({ error: 'demo_not_found' });
    if (!inbox.subscribed) return reply.code(409).send({ error: 'subscription_required' });
    if (inbox.delivering) return reply.code(409).send({ error: 'delivery_in_progress' });
    if (inbox.nextEvent > 30) return reply.code(429).send({ error: 'demo_event_limit' });
    const address = app.server.address();
    if (!address || typeof address === 'string') return reply.code(503).send({ error: 'server_not_listening' });
    const event: Event = {
      event_id: `evt-${inbox.nextEvent++}`,
      type: 'task.created',
      data: { id: 101, title: 'Check the webhook' },
    };
    // Настоящий HTTP-обмен с приёмником того же учебного сервера, без SSRF.
    inbox.delivering = true;
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}${prefix}/${request.params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Key': 'hexlet-demo-webhook',
          Host: 'http.hexlet.app',
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(3000),
      });
      await response.arrayBuffer();
      return reply.code(201).send({ event_id: event.event_id, receiver_status: response.status });
    } finally {
      inbox.delivering = false;
    }
  });
}
