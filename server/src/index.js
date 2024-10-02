import { OpenAPIBackend } from 'openapi-backend';
import fp from 'fastify-plugin';
import path from 'node:path';
import fastifySwagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import { getInitData } from './utils.js';
import getHandlers from './handlers/openapi.js';

const { dirname } = import.meta;

const setUpStaticAssets = (app) => {
  const pathPublic = path.join(dirname, 'assets');
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
      handler: async (request, reply) =>
        api.handleRequest(
          {
            method: request.method,
            path: request.url,
            body: request.body,
            query: request.query,
            headers: request.headers,
          },
          request,
          reply,
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
  setUpStaticAssets(app);
  await initOpenapi(['http-api', 'postman', 'http-protocol'], app);

  app.get('/js-playwright/users-list', (req, res) => res.sendFile('users-list/index.html'));

  return app;
};
