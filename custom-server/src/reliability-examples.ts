import { setTimeout as wait } from 'node:timers/promises';
import type { FastifyInstance } from 'fastify';
import { createDemoStore, DEMO_ORIGIN } from './demo-store.ts';
import type { DemoParams } from './demo-store.ts';

interface Operation {
  id: number;
  title: string;
}
interface Run {
  temporaryAttempts: number;
  slowPending: boolean;
  nextAllowedAt: number | null;
  operations: Operation[];
  keys: Map<string, Operation>;
  journal: { attempt: number; operation_id: number; result: string; response: string }[];
}
export default async function setUpReliabilityExamples(app: FastifyInstance) {
  const runs = createDemoStore<Run>();
  const prefix = '/http-for-automation/reliability/runs';
  app.post(prefix, (_request, reply) => {
    const id = runs.create({
      temporaryAttempts: 0,
      slowPending: false,
      nextAllowedAt: null,
      operations: [],
      keys: new Map(),
      journal: [],
    });
    if (!id) return reply.code(503).send({ error: 'demo_capacity_reached' });
    return reply
      .code(201)
      .header('Cache-Control', 'no-store')
      .send({ run_id: id, base_url: `${DEMO_ORIGIN}${prefix}/${id}` });
  });
  app.get<{ Params: DemoParams }>(`${prefix}/:id/temporary`, (request, reply) => {
    const run = runs.get(request.params.id);
    if (!run) return reply.code(404).send({ error: 'demo_not_found' });
    reply.header('Cache-Control', 'no-store');
    if (run.temporaryAttempts++ === 0)
      return reply.code(503).header('Retry-After', '1').send({ error: 'temporarily_unavailable' });
    return { status: 'ready' };
  });
  app.get<{ Params: DemoParams }>(`${prefix}/:id/limited`, (request, reply) => {
    const run = runs.get(request.params.id);
    if (!run) return reply.code(404).send({ error: 'demo_not_found' });
    reply.header('Cache-Control', 'no-store');
    run.nextAllowedAt ??= Date.now() + 1000;
    if (Date.now() < run.nextAllowedAt)
      return reply.code(429).header('Retry-After', '1').send({ error: 'rate_limit_exceeded' });
    return { status: 'ready' };
  });
  app.get<{ Params: DemoParams }>(`${prefix}/:id/slow`, async (request, reply) => {
    const run = runs.get(request.params.id);
    if (!run) return reply.code(404).send({ error: 'demo_not_found' });
    if (run.slowPending) return reply.code(429).send({ error: 'slow_request_in_progress' });
    run.slowPending = true;
    try {
      await wait(2000);
      return reply.header('Cache-Control', 'no-store').send({ status: 'ready' });
    } finally {
      run.slowPending = false;
    }
  });
  app.get<{ Params: DemoParams }>(`${prefix}/:id/operations`, (request, reply) => {
    const run = runs.get(request.params.id);
    if (!run) return reply.code(404).send({ error: 'demo_not_found' });
    return reply.header('Cache-Control', 'no-store').send({ operations: run.operations });
  });
  app.get<{ Params: DemoParams }>(`${prefix}/:id/journal`, (request, reply) => {
    const run = runs.get(request.params.id);
    if (!run) return reply.code(404).send({ error: 'demo_not_found' });
    return reply.header('Cache-Control', 'no-store').send({ journal: run.journal });
  });
  app.post<{ Params: DemoParams; Querystring: { lose_response?: string }; Body: { title?: string } }>(
    `${prefix}/:id/operations`,
    (request, reply) => {
      const run = runs.get(request.params.id);
      if (!run) return reply.code(404).send({ error: 'demo_not_found' });
      const title = request.body?.title;
      const key = request.headers['idempotency-key'];
      if (
        typeof title !== 'string' ||
        !title.trim() ||
        title.length > 120 ||
        (key !== undefined && (typeof key !== 'string' || key.length > 80 || !key))
      ) {
        return reply.code(422).send({ error: 'invalid_operation' });
      }
      const previous = key === undefined ? undefined : run.keys.get(key);
      if (previous && previous.title !== title) return reply.code(409).send({ error: 'idempotency_key_conflict' });
      if (run.journal.length >= 40 || (!previous && run.operations.length >= 20)) {
        return reply.code(429).send({ error: 'demo_operation_limit' });
      }
      const operation = previous ?? { id: run.operations.length + 1, title };
      if (!previous) {
        run.operations.push(operation);
        if (key !== undefined) run.keys.set(key, operation);
      }
      const lose = !previous && request.query.lose_response === '1';
      run.journal.push({
        attempt: run.journal.length + 1,
        operation_id: operation.id,
        result: previous ? 'reused' : 'created',
        response: lose ? 'connection_closed' : 'sent',
      });
      if (lose) {
        // Операция уже зафиксирована, но клиент не получает HTTP-ответ.
        reply.hijack();
        reply.raw.destroy();
        return reply;
      }
      return reply
        .code(previous ? 200 : 201)
        .header('Cache-Control', 'no-store')
        .send(operation);
    },
  );
}
