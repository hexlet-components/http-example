import { OpenAPIBackend } from 'openapi-backend';
import fastify from 'fastify';
import { getInitData, getId, getToken } from './utils.js';

const app = () => {
  const port = 5000;

  const state = getInitData();

  const api = new OpenAPIBackend({
    definition: 'tsp-output/@typespec/openapi3/openapi.yaml',
    handlers: {
      // Login handlers
      AuthService_create: (c, req, res) => {
        const token = getToken();
        state.tokens.push(token);
        return res.status(200).send({ token });
      },

      // Users handlers
      UserService_create: (c, req, res) => {
        const {
          firstName,
          lastName,
          email,
        } = JSON.parse(c.request.body);
        const user = {
          id: getId(),
          firstName,
          lastName,
          email,
        };

        state.users.push(user);
        return res.status(200).send(user);
      },
      UserService_list: (c, req, res) => {
        const skip = parseInt(c.request.query.skip, 10) ?? 0;
        const limit = parseInt(c.request.query.limit, 10) ?? 100;
        const users = state.users.slice(skip, skip + limit);
        res.status(200).send({
          users,
          total: state.users.length,
          skip,
          limit,
        });
      },
      UserService_get: (c, req, res) => {
        const { id } = c.request.params;
        const user = state.users.find((item) => item.id === id);
        if (!user) {
          return res.status(404).send({ status: 404, err: 'Not found' });
        }
        return res.status(200).send(user);
      },
      UserService_update: (c, req, res) => {
        const { id } = c.request.params;
        const user = state.users.find((item) => item.id === id);
        const {
          firstName,
          lastName,
          email,
        } = JSON.parse(c.request.body);
        user.firstName = firstName,
        user.lastName = lastName,
        user.email = email;
        return res.status(200).send(user);
      },
      UserService_delete: (c, req, res) => {
        const { id } = c.request.params;
        const users = state.users.filter((item) => item.id !== id);
        state.users = users;
        return res.status(200).send(id);
      },

      // Posts handlers
      PostService_create: (c, req, res) => {
        const {
          userId,
          title,
          body,
        } = JSON.parse(c.request.body);
        const post = {
          id: getId(),
          userId,
          title,
          body,
        };

        state.posts.push(post);
        return res.status(200).send(post);
      },
      PostService_list: (c, req, res) => {
        const skip = parseInt(c.request.query.skip, 10) ?? 0;
        const limit = parseInt(c.request.query.limit, 10) ?? 100;
        const posts = state.posts.slice(skip, skip + limit);
        res.status(200).send({
          posts,
          total: state.posts.length,
          skip,
          limit,
        });
      },
      PostService_get: (c, req, res) => {
        const { id } = c.request.params;
        const post = state.posts.find((item) => item.id === id);
        if (!post) {
          return res.status(404).send({ status: 404, err: 'Not found' });
        }
        return res.status(200).send(post);
      },
      PostService_update: (c, req, res) => {
        const { id } = c.request.params;
        const post = state.posts.find((item) => item.id === id);
        const {
          userId,
          title,
          body,
        } = JSON.parse(c.request.body);
        post.userId = userId,
        post.title = title,
        post.body = body;
        return res.status(200).send(post);
      },
      PostService_delete: (c, req, res) => {
        const { id } = c.request.params;
        const posts = state.posts.filter((item) => item.id !== id);
        state.posts = posts;
        return res.status(200).send(id);
      },

      // Comments handlers
      CommentService_create: (c, req, res) => {
        const {
          userId,
          body,
        } = JSON.parse(c.request.body);
        const comment = {
          id: getId(),
          userId,
          body
        };

        state.comments.push(comment);
        return res.status(200).send(comment);
      },
      CommentService_list: (c, req, res) => {
        const skip = parseInt(c.request.query.skip, 10) ?? 0;
        const limit = parseInt(c.request.query.limit, 10) ?? 100;
        const comments = state.comments.slice(skip, skip + limit);
        res.status(200).send({
          comments,
          total: state.comments.length,
          skip,
          limit,
        });
      },
      CommentService_get: (c, req, res) => {
        const { id } = c.request.params;
        const comment = state.comments.find((item) => item.id === id);
        if (!comment) {
          return res.status(404).send({ status: 404, err: 'Not found' });
        }
        return res.status(200).send(comment);
      },
      CommentService_update: (c, req, res) => {
        const { id } = c.request.params;
        const comment = state.comments.find((item) => item.id === id);
        const {
          userId,
          body,
        } = JSON.parse(c.request.body);
        comment.userId = userId;
        comment.body = body;
        return res.status(200).send(comment);
      },
      CommentService_delete: (c, req, res) => {
        const { id } = c.request.params;
        const comments = state.comments.filter((item) => item.id !== id);
        state.comments = comments;
        return res.status(200).send(id);
      },

      validationFail: (c, _req, res) => res.status(400).send({ status: 400, err: c.validation.errors }),
      unauthorizedHandler: (c, req, res) => res
        .status(401)
        .send({ status: 401, err: 'Please authenticate first. Header example: "Authorization: Bearer token"' }),
      notImplementedHandler: (c, req, res) => res
        .status(404)
        .send({ status: 501, err: 'No handler registered for operation' }),
    },
  });

  api.init();

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

  app.listen({ port }, (err, address) => console.log(`Listen ${address}`));
};

export default app;
