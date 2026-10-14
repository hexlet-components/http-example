// JSON-RPC 2.0 endpoint for the http-api course.
// Shows the RPC style next to the REST routes in handlers.ts: one endpoint,
// always POST, errors live in the body and the status is always 200.
//
// Данные и операции берутся из tasks-store.js, того же модуля, из которого
// собираются REST-маршруты. Урок kinds сравнивает два стиля и опирается на то,
// что задача с одним номером в обоих одна и та же.

import type { FastifyInstance } from 'fastify';

import { build, find, list, parseRange, validate } from './tasks-store.ts';
import type { TaskDto } from './tasks-store.ts';

// Negative codes are the protocol level ones defined by the JSON-RPC spec.
// Application errors like "task not found" get positive codes chosen by the API itself.
const errors = {
  invalidRequest: { code: -32600, message: 'Invalid Request' },
  methodNotFound: { code: -32601, message: 'Method not found' },
  invalidParams: { code: -32602, message: 'Invalid params' },
};

// Параметры приходят из тела запроса как есть, проверяет их только код ниже.
type Params = TaskDto & { id?: number; skip?: number; limit?: number };

interface RpcCall {
  jsonrpc?: string;
  method?: unknown;
  params?: Params;
  id?: unknown;
}

const notFound = (id: unknown) => ({ error: { code: 1, message: `Task with id ${id} not found` } });

const methods: Record<string, (params?: Params) => object> = {
  'tasks.list': (params = {}) => {
    const range = parseRange(params);
    if (range === null) {
      return { error: errors.invalidParams };
    }
    return { result: list(range) };
  },

  'tasks.get': (params = {}) => {
    const task = find(params.id);
    return task ? { result: task } : notFound(params.id);
  },

  'tasks.create': (params = {}) => {
    if (validate(params).length > 0) {
      return { error: errors.invalidParams };
    }
    return { result: build(params) };
  },

  'tasks.delete': (params = {}) => {
    const task = find(params.id);
    return task ? { result: true } : notFound(params.id);
  },
};

const handleCall = (call: RpcCall | null) => {
  const id = call?.id ?? null;

  if (call?.jsonrpc !== '2.0' || typeof call.method !== 'string') {
    return { jsonrpc: '2.0', error: errors.invalidRequest, id };
  }

  const method = methods[call.method];
  if (!method) {
    return { jsonrpc: '2.0', error: errors.methodNotFound, id };
  }

  return { jsonrpc: '2.0', ...method(call.params), id };
};

export default (app: FastifyInstance) => {
  app.post('/http-api/rpc', (req, res) => {
    const body = Array.isArray(req.body) ? req.body.map(handleCall) : handleCall(req.body as RpcCall);
    res.send(body);
  });
};
