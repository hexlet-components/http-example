// JSON-RPC 2.0 endpoint for the http-api course.
// Shows the RPC style next to the REST routes served by the prism mock:
// one endpoint, always POST, errors live in the body and the status is always 200.

const tasks = [
  {
    id: 1,
    title: 'Опубликовать курс по основам JavaScript',
    description: 'Автор подготовил курс по JavaScript. Нужно его опубликовать',
    status: 'Backlog',
  },
  {
    id: 2,
    title: 'Записать скринкаст про HTTP API',
    description: 'Показать, чем REST отличается от RPC',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'Обновить документацию',
    description: 'Описать эндпоинт /rpc в спецификации',
    status: 'Done',
  },
];

// Negative codes are the protocol level ones defined by the JSON-RPC spec.
// Application errors like "task not found" get positive codes chosen by the API itself.
const errors = {
  invalidRequest: { code: -32600, message: 'Invalid Request' },
  methodNotFound: { code: -32601, message: 'Method not found' },
  invalidParams: { code: -32602, message: 'Invalid params' },
};

const methods = {
  'tasks.list': (params = {}) => {
    const skip = Number(params.skip ?? 0);
    const limit = Number(params.limit ?? tasks.length);
    if (Number.isNaN(skip) || Number.isNaN(limit)) {
      return { error: errors.invalidParams };
    }
    return { result: { tasks: tasks.slice(skip, skip + limit), total: tasks.length } };
  },

  'tasks.get': (params = {}) => {
    const task = tasks.find((item) => item.id === Number(params.id));
    if (!task) {
      return { error: { code: 1, message: `Task with id ${params.id} not found` } };
    }
    return { result: task };
  },

  'tasks.create': (params = {}) => {
    if (!params.title || !params.description) {
      return { error: errors.invalidParams };
    }
    const task = {
      id: tasks.length + 1,
      title: params.title,
      description: params.description,
      status: params.status ?? 'Backlog',
    };
    return { result: task };
  },

  'tasks.delete': (params = {}) => {
    const task = tasks.find((item) => item.id === Number(params.id));
    if (!task) {
      return { error: { code: 1, message: `Task with id ${params.id} not found` } };
    }
    return { result: true };
  },
};

// The dataset never changes, create and delete only report what would happen.
const handleCall = (call) => {
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

export default (app) => {
  app.post('/http-api/rpc', (req, res) => {
    const body = Array.isArray(req.body) ? req.body.map(handleCall) : handleCall(req.body);
    res.send(body);
  });
};
