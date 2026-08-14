// Описание коллекций: данные, проверки и требования спецификаций.
//
// Все четыре спецификации демонстрационного сервера (http-api, http-protocol,
// js-playwright, postman) объявляют почти одни и те же коллекции, поэтому
// маршруты для них собираются одним кодом. Наборы данных тоже общие: курсы не
// зависят от того, чтобы у каждого префикса были свои записи.
//
// Различия между спецификациями настоящие, и они выписаны в таблице SPECS ниже,
// а не угаданы. Их два:
//
//   1. Схема авторизации. Почти везде Bearer, но задачи курса Postman закрыты
//      Basic, причём включая чтение одной задачи.
//   2. Состав. У js-playwright есть только задачи и пользователи, и там всё
//      открыто; вложенных ресурсов у него нет.
//
// Создание везде отвечает 201: три спецификации объявляли обычный ответ, то есть
// 200, и урок api-testing курса Playwright из-за этого не проходил, хотя учил
// правильному коду. Спецификации выровнены по http-api.
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

const BEARER = 'bearer';
const BASIC = 'basic';

// Автор создаваемой записи не приходит в теле: сервер узнаёт его по токену.
// Урок authentication обращает на это внимание отдельно, показывая, что в ответе
// появилось поле authorId, которого в запросе не было.
const TOKEN_USER_ID = 1;

// Описание одной коллекции, общее для всех префиксов.
const COLLECTIONS = {
  tasks: {
    items: taskStore.items,
    validate: taskStore.validate,
    build: taskStore.build,
  },
  users: {
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
  },
  posts: {
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
  },
  comments: {
    items: () => comments,
    validate: (dto, options = {}) => {
      const problems = validateFields(dto, { required: ['body'], ...options });
      if (dto.postId === undefined) {
        if (options.partial !== true) problems.push('postId обязательно');
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
  },
};

const NESTED = [
  { parent: 'users', child: 'posts', foreignKey: 'authorId' },
  { parent: 'users', child: 'comments', foreignKey: 'authorId' },
  { parent: 'posts', child: 'comments', foreignKey: 'postId' },
];

// Таблица снята со спецификаций в typespec/<app>/services/. Значение это схема
// авторизации операции, отсутствие ключа означает открытую операцию.
const SPECS = [
  {
    prefix: '/http-api',
    collections: {
      tasks: {},
      users: { update: BEARER, remove: BEARER },
      posts: { create: BEARER, update: BEARER, remove: BEARER },
      comments: { create: BEARER, update: BEARER, remove: BEARER },
    },
    nested: NESTED,
  },
  {
    prefix: '/http-protocol',
    collections: {
      tasks: {},
      users: { update: BEARER, remove: BEARER },
      posts: { create: BEARER, update: BEARER, remove: BEARER },
      comments: { create: BEARER, update: BEARER, remove: BEARER },
    },
    nested: NESTED,
  },
  {
    prefix: '/js-playwright',
    collections: {
      tasks: {},
      users: {},
    },
    nested: [],
  },
  {
    prefix: '/postman',
    collections: {
      // Задачи здесь закрыты Basic, и чтение одной задачи тоже.
      tasks: {
        get: BASIC, create: BASIC, update: BASIC, remove: BASIC,
      },
      users: { update: BEARER, remove: BEARER },
      posts: { create: BEARER, update: BEARER, remove: BEARER },
      comments: { create: BEARER, update: BEARER, remove: BEARER },
    },
    nested: NESTED,
  },
];

export default (app) => {
  for (const spec of SPECS) {
    for (const [name, auth] of Object.entries(spec.collections)) {
      registerCollection(app, {
        base: `${spec.prefix}/${name}`,
        envelope: name,
        auth,
        ...COLLECTIONS[name],
      });
    }

    for (const { parent, child, foreignKey } of spec.nested) {
      registerNested(app, {
        base: `${spec.prefix}/${parent}`,
        envelope: child,
        parents: COLLECTIONS[parent].items,
        children: COLLECTIONS[child].items,
        foreignKey,
      });
    }
  }
};
