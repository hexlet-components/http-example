import { faker } from '@faker-js/faker';
import _ from 'lodash';
import users from '../__fixtures__/users.json' with { type: 'json' };
import posts from '../__fixtures__/posts.json' with { type: 'json' };
import comments from '../__fixtures__/comments.json' with { type: 'json' };
import tokens from '../__fixtures__/tokens.json' with { type: 'json' };

const defaultLimit = 30;

export const getToken = () => faker.string.alphanumeric(120);

export const getInitData = () => ({
  users,
  posts,
  comments,
  tokens,
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

export const getId = () => faker.string.uuid();
