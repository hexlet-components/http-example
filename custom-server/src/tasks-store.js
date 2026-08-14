// Операции над задачами, общие для REST-маршрутов и JSON-RPC.
//
// Оба стиля обслуживают одни и те же данные одним и тем же кодом: урок kinds
// курса http-api сравнивает REST и RPC и опирается на то, что задача с одним
// номером в обоих стилях одна и та же.
//
// Набор данных не меняется. Сервер учебный, запросы к нему идут одновременно от
// множества студентов, и мутации сделали бы уроки невоспроизводимыми: следующий
// студент увидел бы не то, что написано в самостоятельной. Поэтому create и
// delete только сообщают, что произошло бы, а список остаётся прежним.

import tasks from './data/tasks.js';

export const DEFAULT_LIMIT = 30;

const STATUSES = ['Backlog', 'Ready', 'In Progress', 'Done', 'Archived'];

// Пустая строка не проходит: в спецификации у title и description стоит
// @minLength(1).
const isFilled = (value) => typeof value === 'string' && value.length > 0;

// Границы страницы приходят и из query REST, и из params RPC, поэтому разбор
// живёт здесь. null означает «значение есть, но негодное» — вызывающий сам
// решает, каким кодом или ошибкой на это ответить.
export const parseRange = ({ skip, limit } = {}) => {
  const parse = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0) return null;
    return number;
  };

  const parsedSkip = parse(skip, 0);
  const parsedLimit = parse(limit, DEFAULT_LIMIT);
  if (parsedSkip === null || parsedLimit === null) return null;
  return { skip: parsedSkip, limit: parsedLimit };
};

// total это размер всего набора, а не страницы: клиент по нему понимает, есть
// ли ещё записи за limit.
export const list = ({ skip, limit }) => ({
  tasks: tasks.slice(skip, skip + limit),
  total: tasks.length,
  skip,
  limit,
});

export const find = (id) => tasks.find((task) => task.id === Number(id));

export const validate = (dto = {}, { partial = false } = {}) => {
  const problems = [];

  for (const field of ['title', 'description']) {
    const value = dto[field];
    if (value === undefined) {
      if (!partial) problems.push(`${field} обязательно`);
      continue;
    }
    if (!isFilled(value)) problems.push(`${field} не может быть пустым`);
  }

  if (dto.status !== undefined && !STATUSES.includes(dto.status)) {
    problems.push(`status должен быть одним из: ${STATUSES.join(', ')}`);
  }

  return problems;
};

export const build = (dto) => ({
  id: tasks.length + 1,
  title: dto.title,
  description: dto.description,
  status: dto.status ?? 'Backlog',
});

export const merge = (task, dto) => ({
  ...task,
  ...Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined)),
  id: task.id,
});
