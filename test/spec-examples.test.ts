import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import expectedComments from '../custom-server/src/data/comments.js';
import expectedPosts from '../custom-server/src/data/posts.js';
import expectedTasks from '../custom-server/src/data/tasks.js';
import expectedUsers from '../custom-server/src/data/users.js';

// Документацию курса читают по спецификации, а данные отдаёт приложение, то
// есть примеры и набор это две копии. Сверка идёт поиском подстроки: разбирать
// YAML нечем, отдельная зависимость ради одной проверки того не стоит.
const spec = readFileSync('./tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml', 'utf8');

// В примере приведены первые три записи, а не весь набор: пример это
// иллюстрация ответа, а не его копия. Сверяется то, что показано, плюс total.
describe('Примеры спецификации не расходятся с наборами', () => {
  it.each(expectedTasks.slice(0, 3))('пример задачи $id', (task) => {
    expect(spec).toContain(task.title);
    expect(spec).toContain(task.description);
  });

  it.each(expectedUsers.slice(0, 3))('пример пользователя $id', (user) => {
    expect(spec).toContain(user.email);
    expect(spec).toContain(user.firstName);
  });

  it.each(expectedPosts.slice(0, 3))('пример поста $id', (post) => {
    expect(spec).toContain(post.title);
  });

  it.each([
    ['Tasks', expectedTasks.length],
    ['Posts', expectedPosts.length],
    ['Comments', expectedComments.length],
  ])('пример %s объявляет реальный total', (_name, total) => {
    expect(spec).toContain(`total: ${total}`);
  });
});
