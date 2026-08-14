// Маршруты коллекций демонстрационного сервера.
//
// Все коллекции регистрируются одним и тем же кодом, потому что коды ответов —
// это учебный материал: на 404, 405, 422, 401, 201 и 204 построены
// самостоятельные работы курса http-api. Раньше их отдавал мок prism из
// спецификации, теперь они написаны руками, и разъехавшиеся реализации дали бы
// разъехавшиеся уроки.
//
// В Caddyfile у этих путей стоит handle без среза префикса, поэтому пути
// регистрируются полностью, как у /http-api/rpc.

import {
  findById, page, parseRange, parseSelect, project,
} from './collections.js';

// Форма ошибки повторяет то, что отдавал prism: заголовок, код и подробности.
const fail = (res, status, title, detail) => res.code(status).send({ title, status, detail });

const notFound = (res, id) => fail(res, 404, 'Not Found', `Записи с идентификатором ${id} нет`);

const methodNotAllowed = (res, allow) => res
  .code(405)
  .header('Allow', allow)
  .send({
    title: 'Method Not Allowed',
    status: 405,
    detail: `Адрес существует, но метод к нему не применяется. Разрешено: ${allow}`,
  });

// Сервер демонстрационный и значение токена не проверяет, важно только наличие
// заголовка. Настоящий сервис здесь сверил бы подпись и срок. Урок
// authentication построен на том, что без заголовка приходит 401.
const hasBearer = (req) => {
  const header = req.headers.authorization;
  return typeof header === 'string' && /^Bearer\s+\S/i.test(header);
};

const unauthorized = (res) => res
  .code(401)
  .header('WWW-Authenticate', 'Bearer')
  .send({
    title: 'Unauthorized',
    status: 401,
    detail: 'Нужен заголовок Authorization с Bearer-токеном',
  });

const withAuth = (needsAuth, handler) => (req, res) => {
  if (needsAuth && !hasBearer(req)) return unauthorized(res);
  return handler(req, res);
};

// items передаётся функцией, а не массивом: у вложенных ресурсов список зависит
// от идентификатора в пути.
export const registerCollection = (app, {
  base,
  envelope,
  items,
  validate,
  build,
  auth = {},
}) => {
  const item = `${base}/:id`;

  app.get(base, (req, res) => {
    const range = parseRange(req.query);
    if (range === null) {
      return fail(res, 422, 'Invalid request', 'skip и limit это целые числа не меньше нуля');
    }
    const fields = parseSelect(req.query.select);
    return res.send(page({ items: items(), envelope, ...range, fields }));
  });

  app.get(item, (req, res) => {
    const found = findById(items(), req.params.id);
    if (!found) return notFound(res, req.params.id);
    return res.send(project(found, parseSelect(req.query.select)));
  });

  app.post(base, withAuth(auth.create, (req, res) => {
    const problems = validate(req.body ?? {});
    if (problems.length > 0) {
      return fail(res, 422, 'Invalid request', problems.join('; '));
    }
    return res.code(201).send(build(req.body ?? {}));
  }));

  app.patch(item, withAuth(auth.update, (req, res) => {
    const found = findById(items(), req.params.id);
    if (!found) return notFound(res, req.params.id);
    const problems = validate(req.body ?? {}, { partial: true });
    if (problems.length > 0) {
      return fail(res, 422, 'Invalid request', problems.join('; '));
    }
    const dto = Object.fromEntries(
      Object.entries(req.body ?? {}).filter(([, value]) => value !== undefined),
    );
    return res.send({ ...found, ...dto, id: found.id });
  }));

  app.delete(item, withAuth(auth.remove, (req, res) => {
    const found = findById(items(), req.params.id);
    if (!found) return notFound(res, req.params.id);
    return res.code(204).send();
  }));

  // Без этих маршрутов fastify ответил бы 404 на существующий адрес с неверным
  // методом. Урок kinds просит сравнить три неудачных запроса и получить три
  // разных кода, и 405 на `DELETE /tasks` один из них.
  app.route({
    method: ['DELETE', 'PATCH', 'PUT'],
    url: base,
    handler: (req, res) => methodNotAllowed(res, 'GET, POST'),
  });

  app.route({
    method: ['POST', 'PUT'],
    url: item,
    handler: (req, res) => methodNotAllowed(res, 'GET, PATCH, DELETE'),
  });
};

// Вложенный ресурс отбирает записи по родителю: именно этого не умел мок, из-за
// чего `/users/1/posts` отдавал тот же список, что `/posts`.
export const registerNested = (app, {
  base, envelope, parents, children, foreignKey,
}) => {
  const url = `${base}/:id/${envelope}`;

  app.get(url, (req, res) => {
    if (!findById(parents(), req.params.id)) return notFound(res, req.params.id);
    const range = parseRange(req.query);
    if (range === null) {
      return fail(res, 422, 'Invalid request', 'skip и limit это целые числа не меньше нуля');
    }
    const own = children().filter((child) => child[foreignKey] === Number(req.params.id));
    return res.send(page({
      items: own, envelope, ...range, fields: parseSelect(req.query.select),
    }));
  });

  app.route({
    method: ['POST', 'PATCH', 'PUT', 'DELETE'],
    url,
    handler: (req, res) => methodNotAllowed(res, 'GET'),
  });
};
