import { faker } from '@faker-js/faker';
import _ from 'lodash';
import users from '../__fixtures__/users.json' with { type: 'json' };
import posts from '../__fixtures__/posts.json' with { type: 'json' };
import comments from '../__fixtures__/comments.json' with { type: 'json' };

const listSize = 10;
const defaultLimit = 30;

const createUser = () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
});

const createPost = (user) => ({
  id: faker.string.uuid(),
  authorId: user.id,
  title: faker.lorem.words(),
  body: faker.lorem.paragraphs(),
});

const createComment = (post) => ({
  id: faker.string.uuid(),
  authorId: post.authorId,
  postId: post.id,
  body: faker.lorem.paragraphs(),
});

export const getToken = () => faker.string.alphanumeric(120);

export const getInitData = () => {
  // const users = [];
  
  // for(let i = 1; i <= listSize; i++) {
  //   users.push(createUser());
  // }

  // const posts = users.map((user) => {
  //   const userPosts = [];
  //   for(let i = 1; i <= listSize; i++) {
  //     userPosts.push(createPost(user));
  //   }
  //   return userPosts;
  // }).flat();

  // const comments = posts.map((post) => {
  //   const postComments = [];
  //   for(let i = 1; i <= listSize; i++) {
  //     postComments.push(createComment(post));
  //   }
  //   return postComments;
  // }).flat();

  return {
    users,
    posts,
    comments,
    tokens: [],
  };
};

export const prepareItem = (item, selectors = []) => {
  if (selectors.length) {
    return {
      id: item.id,
      ..._.pick(item, selectors),
    };
  }
  return item;
};

export const prepareListData = (name, state, context, callbackFilter = () => true) => {
  const skip = parseInt(context.request.query.skip ?? 0, 10)
  const limit = parseInt(context.request.query.limit ?? defaultLimit, 10);
  const { select } = context.request.query ?? [];
  const totalList = state[name].filter(callbackFilter);
  let list = totalList.slice(skip, skip + limit);
  if (select) {
    list = list.map((item) => prepareItem(item, select));
  }
  return {
    [name]: list,
    total: totalList.length,
    skip,
    limit,
  };
};

export const getId = () => faker.string.uuid();
