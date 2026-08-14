// Описание коллекций: данные, проверки и требования к авторизации.
//
// Требования к авторизации взяты из спецификации: @useAuth(BearerAuth) стоит у
// создания, обновления и удаления постов и комментариев и у обновления с
// удалением пользователей. У задач авторизации нет.
//
// Наборы данных не меняются. Сервер учебный, запросы к нему идут одновременно от
// множества студентов, и мутации сделали бы уроки невоспроизводимыми:
// самостоятельная описывает один набор, а следующий студент получил бы другой.
// Поэтому create, update и delete только сообщают, что произошло бы.

import { nextId, validateFields } from './collections.js';
import { registerCollection, registerNested } from './routes.js';
// Задачи описаны отдельным модулем, потому что тот же код вызывает JSON-RPC.
import * as taskStore from './tasks-store.js';

import comments from './data/comments.js';
import posts from './data/posts.js';
import users from './data/users.js';

// Автор создаваемой записи не приходит в теле: сервер узнаёт его по токену.
// Урок authentication обращает на это внимание отдельно, показывая, что в ответе
// появилось поле authorId, которого в запросе не было.
const TOKEN_USER_ID = 1;

export default (app) => {
  registerCollection(app, {
    base: '/http-api/tasks',
    envelope: 'tasks',
    items: taskStore.items,
    validate: taskStore.validate,
    build: taskStore.build,
  });

  registerCollection(app, {
    base: '/http-api/users',
    envelope: 'users',
    items: () => users,
    validate: (dto, options = {}) => validateFields(dto, {
      required: ['email', 'firstName', 'lastName', 'password'],
      ...options,
    }),
    // Пароль в ответе не возвращается, его нет в модели User.
    build: (dto) => ({
      id: nextId(users),
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    }),
    auth: { update: true, remove: true },
  });

  registerCollection(app, {
    base: '/http-api/posts',
    envelope: 'posts',
    items: () => posts,
    validate: (dto, options = {}) => validateFields(dto, {
      required: ['title', 'body'],
      ...options,
    }),
    build: (dto) => ({
      id: nextId(posts),
      authorId: TOKEN_USER_ID,
      title: dto.title,
      body: dto.body,
    }),
    auth: { create: true, update: true, remove: true },
  });

  registerCollection(app, {
    base: '/http-api/comments',
    envelope: 'comments',
    items: () => comments,
    validate: (dto, options = {}) => {
      const problems = validateFields(dto, { required: ['body'], ...options });
      const needsPostId = options.partial !== true;
      if (dto.postId === undefined) {
        if (needsPostId) problems.push('postId обязательно');
      } else if (!Number.isInteger(Number(dto.postId))) {
        problems.push('postId это целое число');
      }
      return problems;
    },
    build: (dto) => ({
      id: nextId(comments),
      authorId: TOKEN_USER_ID,
      postId: Number(dto.postId),
      body: dto.body,
    }),
    auth: { create: true, update: true, remove: true },
  });

  registerNested(app, {
    base: '/http-api/users',
    envelope: 'posts',
    parents: () => users,
    children: () => posts,
    foreignKey: 'authorId',
  });

  registerNested(app, {
    base: '/http-api/users',
    envelope: 'comments',
    parents: () => users,
    children: () => comments,
    foreignKey: 'authorId',
  });

  registerNested(app, {
    base: '/http-api/posts',
    envelope: 'comments',
    parents: () => posts,
    children: () => comments,
    foreignKey: 'postId',
  });
};
