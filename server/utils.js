import { faker } from '@faker-js/faker';

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
  const users = [];
  
  for(let i = 1; i <= 10; i++) {
    users.push(createUser());
  }

  const posts = users.map((user) => {
    const userPosts = [];
    for(let i = 1; i <= 10; i++) {
      userPosts.push(createPost(user));
    }
    return userPosts;
  }).flat();

  const comments = posts.map((post) => {
    const postComments = [];
    for(let i = 1; i <= 10; i++) {
      postComments.push(createComment(post));
    }
    return postComments;
  }).flat();

  return {
    users,
    posts,
    comments,
    tokens: [],
  };
};

export const getId = () => faker.string.uuid();
