// Обработчики операций курса HTTP API.
//
// Ключи объекта это operationId из спецификации, по ним обработчик находит
// fastify-openapi-glue. Тип RouteHandlers сгенерирован из той же спецификации
// (custom-server/src/generated/, `make generate`), поэтому лишний или
// переименованный ключ виден проверкой типов, а не в рантайме.
//
// Здесь нет ни разбора параметров, ни проверки обязательных полей, ни кодов
// 401, 404 и 405: всё это описано в спецификации и делается до обработчика.
// Остаётся выборка из набора данных, то есть то, ради чего маршруты и забрали
// у мока: skip, limit, select и отбор по идентификатору в пути.
import type { RouteHandlers } from './generated/fastify.gen.ts';

import { findById, nextId, page, parseSelect, project } from './collections.js';
// Сборка новой задачи берётся из того же модуля, что и у JSON-RPC: урок kinds
// сравнивает два стиля и опирается на то, что они делают одно и то же.
import { build as buildTask } from './tasks-store.js';
import comments from './data/comments.js';
import courses from './data/courses.js';
import posts from './data/posts.js';
import tasks from './data/tasks.js';
import users from './data/users.js';

// Автор создаваемой записи не приходит в теле: сервер узнаёт его по токену.
// Урок authentication обращает на это внимание отдельно, показывая, что в
// ответе появилось поле authorId, которого в запросе не было.
const TOKEN_USER_ID = 1;

// Тот же токен приведён примером к модели AuthToken в спецификации и напечатан
// в уроке authentication.
const TOKEN = 'r4AR4Fo0j29s9mFk4IUVA2rGTQmIrHWlioifaJLSQQYHbTXHxtSLFUVp8PANrRoAb7fgkSsbN7lt4a86pcJ07ivUpxBLyyCHaY4Pp9I7hRPphCHM7xpZ1om1';

const notFound = (reply, id) => reply
  .code(404)
  .send({ code: 404, message: `Записи с идентификатором ${id} нет` });

// Наборы данных не меняются. Сервер учебный, запросы к нему идут одновременно
// от множества студентов, и мутации сделали бы уроки невоспроизводимыми:
// самостоятельная описывает один набор, а следующий студент получил бы другой.
// Поэтому create, update и delete только сообщают, что произошло бы.
const collection = (items, envelope, build) => ({
  list: (req, reply) => reply.send(page({
    items,
    envelope,
    skip: req.query.skip,
    limit: req.query.limit,
    fields: parseSelect(req.query.select),
  })),

  get: (req, reply) => {
    const found = findById(items, req.params.id);
    if (!found) return notFound(reply, req.params.id);
    return reply.send(project(found, parseSelect(req.query.select)));
  },

  create: (req, reply) => reply.code(201).send(build(req.body)),

  update: (req, reply) => {
    const found = findById(items, req.params.id);
    if (!found) return notFound(reply, req.params.id);
    return reply.send({ ...found, ...req.body, id: found.id });
  },

  remove: (req, reply) => {
    const found = findById(items, req.params.id);
    if (!found) return notFound(reply, req.params.id);
    return reply.code(204).send();
  },
});

// Вложенный ресурс отбирает записи по родителю: именно этого не умел мок,
// из-за чего /users/1/posts отдавал тот же список, что /posts.
const nested = (parents, children, envelope, foreignKey) => (req, reply) => {
  // Имя параметра пути берётся из спецификации: у постов автора это authorId,
  // у комментариев поста postId, а не общий id.
  const parentId = req.params[foreignKey];
  const parent = findById(parents, parentId);
  if (!parent) return notFound(reply, parentId);
  const own = children.filter((child) => child[foreignKey] === parent.id);
  return reply.send(page({
    items: own,
    envelope,
    skip: req.query.skip,
    limit: req.query.limit,
    fields: parseSelect(req.query.select),
  }));
};

const usersRoutes = collection(users, 'users', (dto) => ({
  id: nextId(users),
  email: dto.email,
  firstName: dto.firstName,
  lastName: dto.lastName,
  // Пароля в ответе нет, его нет и в модели User.
}));

const postsRoutes = collection(posts, 'posts', (dto) => ({
  id: nextId(posts),
  authorId: TOKEN_USER_ID,
  title: dto.title,
  body: dto.body,
}));

const commentsRoutes = collection(comments, 'comments', (dto) => ({
  id: nextId(comments),
  authorId: TOKEN_USER_ID,
  postId: Number(dto.postId),
  body: dto.body,
}));

const tasksRoutes = collection(tasks, 'tasks', buildTask);

const coursesRoutes = collection(courses, 'courses', (dto) => ({
  id: nextId(courses),
  title: dto.title,
  description: dto.description,
}));

const handlers: RouteHandlers = {
  userServiceList: usersRoutes.list,
  userServiceGet: usersRoutes.get,
  userServiceCreate: usersRoutes.create,
  userServiceUpdate: usersRoutes.update,
  userServiceDelete: usersRoutes.remove,
  userServiceGetPosts: nested(users, posts, 'posts', 'authorId'),
  userServiceGetComments: nested(users, comments, 'comments', 'authorId'),

  postServiceList: postsRoutes.list,
  postServiceGet: postsRoutes.get,
  postServiceCreate: postsRoutes.create,
  postServiceUpdate: postsRoutes.update,
  postServiceDelete: postsRoutes.remove,
  postServiceGetComments: nested(posts, comments, 'comments', 'postId'),

  commentServiceList: commentsRoutes.list,
  commentServiceGet: commentsRoutes.get,
  commentServiceCreate: commentsRoutes.create,
  commentServiceUpdate: commentsRoutes.update,
  commentServiceDelete: commentsRoutes.remove,

  taskServiceList: tasksRoutes.list,
  taskServiceGet: tasksRoutes.get,
  taskServiceCreate: tasksRoutes.create,
  taskServiceUpdate: tasksRoutes.update,
  taskServiceDelete: tasksRoutes.remove,

  courseServiceList: coursesRoutes.list,
  courseServiceGet: coursesRoutes.get,
  courseServiceCreate: coursesRoutes.create,
  courseServiceUpdate: coursesRoutes.update,
  courseServiceDelete: coursesRoutes.remove,

  authServiceCreate: (req, reply) => reply.send({ token: TOKEN }),
};

export default handlers;
