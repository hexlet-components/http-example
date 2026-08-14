// REST-маршруты для /http-api/tasks.
//
// Эти пути забраны у мока prism и обслуживаются здесь, потому что статичный мок
// отдаёт пример из спецификации дословно: он не применял skip и limit и на любой
// /tasks/{id} отдавал одну и ту же задачу. Разбор — FEEDBACK-371, #16.
//
// Коды ответов раньше давал prism из спецификации, и на них построены
// самостоятельные работы курса http-api. Здесь они воспроизводятся руками, а
// держит их прогон bin/smoke-test.js.
//
// Маршрутизация: в Caddyfile у /http-api/tasks стоит handle без среза префикса,
// поэтому пути регистрируются полностью, как у /http-api/rpc.

import {
  build, find, list, merge, parseRange, validate,
} from './tasks-store.js';

const COLLECTION = '/http-api/tasks';
const ITEM = '/http-api/tasks/:id';

// Форма ошибки та же, что была у prism: тип, заголовок, код и подробности.
// Студент видел её в уроках, менять её незачем.
const fail = (res, status, title, detail) => res
  .code(status)
  .send({ title, status, detail });

const methodNotAllowed = (res, allow) => res
  .code(405)
  .header('Allow', allow)
  .send({
    title: 'Method Not Allowed',
    status: 405,
    detail: `Адрес существует, но метод к нему не применяется. Разрешено: ${allow}`,
  });

export default (app) => {
  app.get(COLLECTION, (req, res) => {
    const range = parseRange(req.query);
    if (range === null) {
      return fail(res, 422, 'Invalid request', 'skip и limit это целые числа не меньше нуля');
    }
    return res.send(list(range));
  });

  app.post(COLLECTION, (req, res) => {
    const problems = validate(req.body ?? {});
    if (problems.length > 0) {
      return fail(res, 422, 'Invalid request', problems.join('; '));
    }
    return res.code(201).send(build(req.body));
  });

  app.get(ITEM, (req, res) => {
    const task = find(req.params.id);
    if (!task) {
      return fail(res, 404, 'Not Found', `Задачи с идентификатором ${req.params.id} нет`);
    }
    return res.send(task);
  });

  app.patch(ITEM, (req, res) => {
    const task = find(req.params.id);
    if (!task) {
      return fail(res, 404, 'Not Found', `Задачи с идентификатором ${req.params.id} нет`);
    }
    const problems = validate(req.body ?? {}, { partial: true });
    if (problems.length > 0) {
      return fail(res, 422, 'Invalid request', problems.join('; '));
    }
    return res.send(merge(task, req.body ?? {}));
  });

  app.delete(ITEM, (req, res) => {
    const task = find(req.params.id);
    if (!task) {
      return fail(res, 404, 'Not Found', `Задачи с идентификатором ${req.params.id} нет`);
    }
    return res.code(204).send();
  });

  // Без этих маршрутов fastify ответил бы 404 на существующий адрес с неверным
  // методом. Урок kinds просит студента сравнить три неудачных запроса и
  // получить три разных кода, и 405 на `DELETE /tasks` один из них.
  app.route({
    method: ['DELETE', 'PATCH', 'PUT'],
    url: COLLECTION,
    handler: (req, res) => methodNotAllowed(res, 'GET, POST'),
  });

  app.route({
    method: ['POST', 'PUT'],
    url: ITEM,
    handler: (req, res) => methodNotAllowed(res, 'GET, PATCH, DELETE'),
  });
};
