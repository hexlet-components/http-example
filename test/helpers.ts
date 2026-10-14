import Fastify from 'fastify';
import type { FastifyInstance, InjectOptions } from 'fastify';

import app, { options } from '../custom-server/src/index.ts';

export const UINT16_MAX = 65535;

// Приложение собирается так же, как это делает `fastify start --options`:
// options отдаёт настройку ajv (формат uint16), а без неё сборка схемы падает
// на старте. Поэтому экземпляр создаётся с options, а не голым Fastify().
export const buildApp = async (): Promise<FastifyInstance> => {
  const instance = Fastify(options);
  await instance.register(app);
  await instance.ready();
  return instance;
};

export interface Reply {
  status: number;
  body: any;
  headers: Record<string, any>;
}

export const createClient = (instance: FastifyInstance) => {
  const send = async (url: string, opts: InjectOptions = {}): Promise<Reply> => {
    const response = await instance.inject({ url, method: 'GET', ...opts });
    const text = response.body;
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      // не JSON, остаётся текстом
    }
    return { status: response.statusCode, body, headers: response.headers };
  };

  const json = (url: string, method: InjectOptions['method'], payload?: unknown, headers = {}) => send(url, {
    method,
    headers: payload === undefined ? headers : { 'content-type': 'application/json', ...headers },
    payload: payload === undefined ? undefined : JSON.stringify(payload),
  });

  const rpc = (method: string, params?: unknown) => json('/http-api/rpc', 'POST', {
    jsonrpc: '2.0', method, params, id: 1,
  });

  return { send, json, rpc };
};

// Спецификация объявляет id, total, skip и limit как uint16. Проверяется каждое
// число ответа, а не только id: отрицательный total ломал уроки так же.
export const outOfRange = (value: unknown, path = '$'): string[] => {
  if (typeof value === 'number') {
    const bad = !Number.isInteger(value) || value < 0 || value > UINT16_MAX;
    return bad ? [`${path} = ${value}`] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => outOfRange(item, `${path}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => outOfRange(item, `${path}.${key}`));
  }
  return [];
};
