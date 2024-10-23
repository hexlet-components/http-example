import { faker } from '@faker-js/faker';
import _ from 'lodash';
import users from '../examples/users.json' with { type: 'json' };
import posts from '../examples/posts.json' with { type: 'json' };
import comments from '../examples/comments.json' with { type: 'json' };
import courses from '../examples/courses.json' with { type: 'json' };
import tasks from '../examples/tasks.json' with { type: 'json' };
import tokens from '../examples/tokens.json' with { type: 'json' };
import appConfig from '../../app.config.json' with { type: 'json' };

const listSize = 10;
const defaultLimit = 30;

export const getId = () => _.uniqueId('1000');

const createUser = () => ({
  id: getId(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
});

const createPost = (user) => ({
  id: getId(),
  authorId: user.id,
  title: faker.lorem.words(),
  body: faker.lorem.paragraphs(),
});

const createComment = (post) => ({
  id: getId(),
  authorId: post.authorId,
  postId: post.id,
  body: faker.lorem.paragraphs(),
});

export const generateInitData = () => {
  const users = [];
  
  for(let i = 1; i <= listSize; i++) {
    users.push(createUser());
  }

  const posts = users.map((user) => {
    const userPosts = [];
    for(let i = 1; i <= listSize; i++) {
      userPosts.push(createPost(user));
    }
    return userPosts;
  }).flat();

  const comments = posts.map((post) => {
    const postComments = [];
    for(let i = 1; i <= listSize; i++) {
      postComments.push(createComment(post));
    }
    return postComments;
  }).flat();

  return {
    users,
    posts,
    comments,
  };
};

export const getToken = () => faker.string.alphanumeric(120);

export const getInitData = () => ({
  users,
  posts,
  comments,
  tokens,
  courses,
  tasks,
  appConfig,
});

export const prepareItem = (item, selectors = []) => {
  const data = selectors.length ? { id: item.id, ..._.pick(item, selectors)} : item;
  return _.omit(data, 'password');
};

export const prepareListData = (name, state, context, callbackFilter = () => true) => {
  const skip = parseInt(context.request.query.skip ?? 0, 10)
  const limit = parseInt(context.request.query.limit ?? defaultLimit, 10);
  const { select } = context.request.query ?? {};
  const totalList = state[name].filter(callbackFilter);
  let list = totalList.slice(skip, skip + limit).map((item) => prepareItem(item, select));
  return {
    [name]: list,
    total: totalList.length,
    skip,
    limit,
  };
};

export const getUserByToken = (context, state) => {
  const authHeader = context.request.headers['authorization'];
  const token = authHeader.replace('Bearer ', '');
  const authData = state.tokens.find((item) => item.token === token);
  if (!authData) {
    return null;
  }
  const user = state.users.find((item) => item.id === authData.userId);
  return user;
};
