import path from 'node:path';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import allow from 'fastify-allow';
import fastifyCookie from '@fastify/cookie';

import appConfig from '../../app.config.json'  with {type: 'json'}
import setUpRpc from './rpc.js';
import setUpSpec from './openapi-spec.ts';

const { dirname } = import.meta;

const setUpStaticAssets = (app) => {
  const pathPublic = path.join(dirname, '../assets');
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setupDocs = async (app) => {
  const getPromises = (instance) => appConfig.apps.map(async (name) => {
    const openapiFilePath = path.join(dirname, '../../tsp-output/', name, '/@typespec/openapi3/openapi.1.0.yaml');
    return await instance.register(async (innerInstance) => {
      await instance.register(fastifySwagger, {
        mode: 'static',
        title: appConfig.title,
        exposeRoute: true,
        specification: {
          path: openapiFilePath,
        },
        // routePrefix: `${name}-${appConfig.docRoute}`,
      });

      await instance.register(swaggerUI, {
        routePrefix: `${name}-${appConfig.docRoute}`,
        title: appConfig.title,
        staticCSP: false,
        transformSpecificationClone: true,
        theme: {
          title: appConfig.title,
        },
      });
    });
  })

  await app.register(fp((instance) => Promise.all(getPromises(instance))));

};
// Опции самого экземпляра fastify: fastify-cli подхватывает этот экспорт, но
// только с флагом --options. Без флага ajv не узнает про формат ниже, сборка
// схемы падает на старте, и падает молча: код 1 и ни строки вывода.
//
// TypeSpec пишет в спецификацию `format: uint16` и больше ничем диапазон не
// выражает: ни minimum, ни maximum в схеме нет. Поэтому формат объявляется не
// заглушкой, а проверкой: иначе `?skip=-1` проходит валидацию, а срез массива
// от отрицательного числа отдаёт хвост списка вместо ошибки.
const UINT16_MAX = 65535;

export const options = {
  ajv: {
    customOptions: {
      formats: {
        uint16: {
          type: 'number',
          validate: (value) => Number.isInteger(value) && value >= 0 && value <= UINT16_MAX,
        },
      },
    },
  },
};

export default async (app, _options) => {
  // Метод, которого у адреса нет, отвечает 405 и заголовком Allow, а не 404.
  // Самостоятельная урока kinds просит выполнить три заведомо неудачных
  // запроса и записать три *разных* кода, и DELETE /tasks один из них.
  // Регистрируется в корне: onRequest-хуки вложенного плагина на
  // несопоставленном маршруте не отрабатывают.
  await app.register(allow);

  // Свой обработчик ненайденного маршрута нужен не ради текста ответа: без него
  // 404 обрабатывается корневым контекстом fastify, куда хуки этого плагина не
  // достают, и fastify-allow не успевает превратить неверный метод в 405.
  app.setNotFoundHandler((req, res) => res.code(404).send({
    code: 404,
    message: `Адреса ${req.url} нет`,
  }));

  await app.register(formbody);
  await app.register(fastifyCookie, {
    secret: 'my-secret',
  });
  setUpStaticAssets(app);

  await setupDocs(app);

  app.get('/http-protocol/example', (req, res) => {
    res
      .headers({
        Expires: -1,
        'Cache-Control': 'private, max-age=0',
        'Content-Type': 'text/html; charset=ISO-8859-1',
        'P3P': 'CP="This is not a P3P policy! See g.co/p3phelp for more info."',
        Server: 'gws',
        'X-XSS-Protection': 0,
        'X-Frame-Options': 'SAMEORIGIN',
        'Accept-Ranges': 'none',
        Vary: 'Accept-Encoding',
        'Set-Cookie': [
          '1P_JAR=2020-01-18-09; expires=Mon, 17-Feb-2020 09:24:50 GMT; path=/; domain=.hexlet.app; Secure',
          'NID=196=wsHLMAMfnAaSyF7zduokI8TJeE5UoIKPHYC58HYH93VMnev9Nc2bAjhRdzoc4UhmuOd7ZVCorDnzGDe51yPefsRMeVyOFnYdHYYgQNqI8A1dYuk4pDK4OJurQgL4lX8kiNGSNi_kkUESFQ-MqLCB_YspxA9JRejhZdkTRtGyHNk; expires=Sun, 19-Jul-2020 09:24:50 GMT; path=/; domain=.hexlet.app; HttpOnly',
        ],
      })
      .send('Done!');
  });

  app.post('/http-protocol/login', (req, res) => res.send('Done!'));

  app.get('/http-api/example', (req, res) => res.send('Done!'));

  app.get('/http-protocol/stream', async (req, res) => {
    // Установим заголовок для передачи данных в формате текстового потока
    res.type('text/plain');

    // Функция, которая отправляет чанки данных
    const sendChunks = async () => {
      for (let i = 0; i < 5; i++) {
        // Отправляем чанк данных
        res.raw.write(`Chunk ${i + 1}\n`);
        // Имитация задержки между отправками чанков
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      // Завершаем поток
      res.raw.end();
    };

    // Запускаем отправку чанков
    sendChunks().catch(err => {
      req.log.error(err);
      res.send(err);
    });
  });

  app.get('/http-protocol', (req, res) => res.sendFile('http-protocol/index.html'));

  app.get('/http-protocol/removed', (req, res) => res.code(301).redirect('/http-protocol/example'));

  app.get('/js-playwright/users-list', (req, res) => res.sendFile('users-list/index.html'));

  app.get('/js-dom-testing-library/users-list', (req, res) => res.sendFile('users-list/index.html'));

  app.get('/', (req, res) => res.sendFile('main/index.html'));

  app.post('/http-api/echo', (req, res) => res.send(req.body));

  setUpRpc(app);

  // REST-маршруты коллекций обслуживаются приложением, а не моком prism: см.
  // шапку custom-server/src/routes.js.
  // Маршруты всех четырёх спецификаций. Каждая своим плагином, потому что внутри
  // свой обработчик ошибок: валидация по спецификации отвечает 400, а уроки учат
  // на 422. Список тот же, что задаёт маршруты документации.
  for (const name of appConfig.apps) {
    await app.register(setUpSpec, { name });
  }

  app.get('/postman/cookie', (req, res) => {
    res.setCookie('myCookie', 'cookieValue', {
      path: '/',
      httpOnly: true,
      secure: true, // Используйте true, если вы работаете с HTTPS
      maxAge: 3600 // Время жизни куки в секундах
    })
    .send('Done!');
  });

  return app;
};
