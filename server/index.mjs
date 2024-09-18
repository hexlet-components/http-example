import { OpenAPIBackend } from 'openapi-backend';
import fastify from 'fastify';
import path from 'node:path';
import fastifySwagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { getInitData, getId, getToken, prepareListData, prepareItem } from './utils.mjs';

const title = 'Forum HTTP Api Example';
const { dirname } = import.meta;
const version = '1.0';
const openapiFilePath = path.join(dirname, '..', `tsp-output/@typespec/openapi3/openapi.${version}.yaml`);
const swaggerRoute = '/swagger';

const getUserByToken = (context, state) => {
  const authHeader = context.request.headers['authorization'];
  const token = authHeader.replace('Bearer ', '');
  const authData = state.tokens.find((item) => item.token === token);
  if (!authData) {
    return null;
  }
  const user = state.users.find((item) => item.id === authData.userId);
  return user;
};

const app = async (host, port) => {
  const state = getInitData();

  const api = new OpenAPIBackend({
    definition: openapiFilePath,
    handlers: {
      // Login handlers
      AuthService_create: (c, req, res) => {
        const {
          email,
          password,
        } = c.request.body;
        const user = state.users.find((u) => u.email === email);
        if (!user || user.password !== password) {
          return res.status(401)
            .send({ code: 401, message: 'Wrong email or password' });
        }
        const token = getToken();
        state.tokens.push({ userId: user.id, token });
        return res.status(200).send({ token });
      },

      // Users handlers
      UserService_create: (c, req, res) => {
        const {
          firstName,
          lastName,
          email,
          password,
        } = c.request.body;
        const user = {
          id: getId(),
          firstName,
          lastName,
          email,
          password,
        };

        state.users.push(user);
        return res.status(200).send(user);
      },
      UserService_list: (c, req, res) => res.status(200).send(prepareListData('users', state, c)),
      UserService_get: (c, req, res) => {
        const { id } = c.request.params;
        const { select } = c.request.query.select ?? {};
        const user = state.users.find((item) => item.id === id);
        if (!user) {
          return res.status(404).send({ code: 404, message: 'Not found' });
        }
        return res.status(200).send(prepareItem(user, select));
      },
      UserService_getPosts: (c, req, res) => {
        const { authorId } = c.request.params;
        const data = prepareListData('posts', state, c, (item) => item.authorId === authorId);
        return res.status(200).send(data);
      },
      UserService_getComments: (c, req, res) => {
        const { authorId } = c.request.params;
        const data = prepareListData('comments', state, c, (item) => item.authorId === authorId);
        return res.status(200).send(data);
      },
      UserService_update: (c, req, res) => {
        const { id } = c.request.params;
        const index = state.users.findIndex((item) => item.id === id);
        if (index === -1) {
          return res.status(404).send({ code: 404, message: 'Not found' });
        }
        const currentUser = getUserByToken(c, state);
        if (currentUser?.id !== id) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        state.users[index] = {
          ...state.users[index],
          ...c.request.body,
        };
        return res.status(200).send(state.users[index]);
      },
      UserService_delete: (c, req, res) => {
        const { id } = c.request.params;
        const currentUser = getUserByToken(c, state);
        if (currentUser?.id !== id) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        const users = state.users.filter((item) => item.id !== id);
        state.users = users;
        return res.status(204).send();
      },

      // Posts handlers
      PostService_create: (c, req, res) => {
        const {
          title,
          body,
        } = c.request.body;
        const currentUser = getUserByToken(c, state);
        if (currentUser) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        const post = {
          id: getId(),
          authorId: currentUser.id,
          title,
          body,
        };

        state.posts.push(post);
        return res.status(200).send(post);
      },
      PostService_list: (c, req, res) => prepareListData('posts', state, c),
      PostService_get: (c, req, res) => {
        const { id } = c.request.params;
        const { select } = c.request.query.select ?? {};
        const post = state.posts.find((item) => item.id === id);
        if (!post) {
          return res.status(404).send({ code: 404, message: 'Not found' });
        }
        return res.status(200).send(prepareItem(post, select));
      },
      PostService_getComments: (c, req, res) => {
        const { postId } = c.request.params;
        const data = prepareListData('comments', state, c, (item) => item.postId === postId);
        return res.status(200).send(data);
      },
      PostService_update: (c, req, res) => {
        const { id } = c.request.params;
        const index = state.posts.findIndex((item) => item.id === id);
        if (index === -1) {
          return res.status(404).send({ code: 404, message: 'Not found' });
        }
        const currentUser = getUserByToken(c, state);
        if (currentUser?.id !== state.posts[index].authorId) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        state.posts[index] = {
          ...state.posts[index],
          ...c.request.body,
        };
        return res.status(200).send(state.posts[index]);
      },
      PostService_delete: (c, req, res) => {
        const { id } = c.request.params;
        const index = state.posts.findIndex((item) => item.id === id);
        const currentUser = getUserByToken(c, state);
        if (currentUser?.id !== state.posts[index].authorId) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        const posts = state.posts.filter((item) => item.id !== id);
        state.posts = posts;
        return res.status(204).send();
      },

      // Comments handlers
      CommentService_create: (c, req, res) => {
        const {
          postId,
          body,
        } = c.request.body;
        const currentUser = getUserByToken(c, state);
        if (!currentUser) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        const comment = {
          id: getId(),
          postId,
          authorId: currentUser.id,
          body
        };

        state.comments.push(comment);
        return res.status(200).send(comment);
      },
      CommentService_list: (c, req, res) => prepareListData('comments', state, c),
      CommentService_get: (c, req, res) => {
        const { id } = c.request.params;
        const { select } = c.request.query.select ?? {};
        const comment = state.comments.find((item) => item.id === id);
        if (!comment) {
          return res.status(404).send({ code: 404, message: 'Not found' });
        }
        return res.status(200).send(prepareItem(comment, select));
      },
      CommentService_update: (c, req, res) => {
        const { id } = c.request.params;
        const index = state.comments.findIndex((item) => item.id === id);
        if (index === -1) {
          return res.status(404).send({ code: 404, message: 'Not found' });
        }
        const currentUser = getUserByToken(c, state);
        if (currentUser?.id !== state.comments[index].authorId) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        state.comments[index] = {
          ...state.comments[index],
          ...c.request.body,
        };
        return res.status(200).send(state.comments[index]);
      },
      CommentService_delete: (c, req, res) => {
        const { id } = c.request.params;
        const index = state.comments.findIndex((item) => item.id === id);
        const currentUser = getUserByToken(c, state);
        if (currentUser?.id !== state.comments[index].authorId) {
          return res
            .status(403)
            .send({ code: 403, message: 'Forbidden action' })
        }
        const comments = state.comments.filter((item) => item.id !== id);
        state.comments = comments;
        return res.status(204).send();
      },

      validationFail: (c, _req, res) => res.status(400).send({ code: 400, message: c.validation.errors }),
      unauthorizedHandler: (c, req, res) => res
        .status(401)
        .send({ code: 401, message: 'Please authenticate first. Header example: "Authorization: Bearer token"' }),
      notImplementedHandler: (c, req, res) => res
        .status(404)
        .send({ code: 501, message: 'No handler registered for operation' }),
    },
  });

  api.init();

  api.registerSecurityHandler('BearerAuth', (c) => {
    const authHeader = c.request.headers['authorization'];
    const token = authHeader.replace('Bearer ', '');
    const authorized = !!token; //state.tokens.includes(token);
    return authorized;
  });

  const app = fastify();

  app.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    url: '/*',
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

  await app.register(fastifySwagger, {
    mode: 'static',
    title,
    exposeRoute: true,
    specification: {
      path: openapiFilePath,
    },
    routePrefix: swaggerRoute,
  });


  await app.register(swaggerUI, {
    routePrefix: swaggerRoute,
    title,
    staticCSP: true,
    transformSpecificationClone: true,
    theme: {
      title,
    },
  });

  app.listen({ host, port }, (err, address) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Listen ${address}`);
  });
};

export default app;
