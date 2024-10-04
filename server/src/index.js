import { OpenAPIBackend } from 'openapi-backend';
import fp from 'fastify-plugin';
import path from 'node:path';
import fs from 'node:fs';
import fastifySwagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';
import { getInitData } from './utils.js';
import getHandlers from './handlers/openapi.js';

const { dirname } = import.meta;

const apps = ['http-api', 'postman', 'http-protocol', 'js-playwright'];

const setUpStaticAssets = (app) => {
  const pathPublic = path.join(dirname, '../assets');
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const initOpenapi = async (names, app) => {
  const openapiApps = names.map((name) => {
    const state = getInitData();
    const openapiFilePath = path.join(dirname, '../../tsp-output/', name, '/@typespec/openapi3/openapi.1.0.yaml');

    const api = new OpenAPIBackend({
      definition: openapiFilePath,
      handlers: getHandlers(state),
    });

    api.init();

    api.registerSecurityHandler('BearerAuth', (c) => {
      const authHeader = c.request.headers['authorization'];
      const token = authHeader.replace('Bearer ', '');
      const authorized = !!token; //state.tokens.includes(token);
      return authorized;
    });

    api.registerSecurityHandler('ApiKeyAuth', (c) => {
      const authorized =
        c.request.headers['x-api-key'] === state.appConfig.apiKey;
      // truthy return values are interpreted as auth success
      // you can also add any auth information to the return value
      return authorized;
    });

    app.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      url: `/${name}/*`,
      handler: async (request, res) =>
        api.handleRequest(
          {
            method: request.method,
            path: request.url,
            body: request.body,
            query: request.query,
            headers: request.headers,
          },
          request,
          res,
        ),
    });

    return { name, state, openapiFilePath };
  });

  const getPromises = (instance) => openapiApps.map(async ({ name, state, openapiFilePath }) => {
    return await instance.register(async (instance) => {
      await instance.register(fastifySwagger, {
        mode: 'static',
        title: state.appConfig.title,
        exposeRoute: true,
        specification: {
          path: openapiFilePath,
        },
        routePrefix: `${state.appConfig.docRoute}`,
      });

      await instance.register(swaggerUI, {
        routePrefix: `/${name}/${state.appConfig.docRoute}`,
        title: state.appConfig.title,
        staticCSP: true,
        transformSpecificationClone: true,
        theme: {
          title: state.appConfig.title,
        },
      });
    });
  })

  await app.register(fp((instance) => Promise.all(getPromises(instance))));
};

export default async (app, _options) => {
  await app.register(formbody);
  setUpStaticAssets(app);

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
      request.log.error(err);
      res.send(err);
    });
  });

  app.get('/http-protocol', (req, res) => res.sendFile('http-protocol/index.html'));

  app.get('/http-protocol/removed', (req, res) => res.code(301).redirect('/http-protocol/example'));

  app.get('/js-playwright/users-list', (req, res) => res.sendFile('users-list/index.html'));

  app.get('/js-dom-testing-library/users-list', (req, res) => res.sendFile('users-list/index.html'));

  await initOpenapi(apps, app);

  return app;
};
