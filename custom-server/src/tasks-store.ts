// Задачи: данные и операции, общие для REST и JSON-RPC.
//
// REST-маршруты собираются из этого модуля в resources.js, а JSON-RPC вызывает
// его напрямую. Урок kinds курса http-api сравнивает два стиля и опирается на то,
// что задача с одним номером в обоих одна и та же, поэтому общий модуль здесь не
// украшение, а условие работоспособности урока.

import {
  findById, nextId, page, parseRange, parseSelect, validateFields,
} from './collections.ts';
import tasks from './data/tasks.ts';

const STATUSES = ['Backlog', 'Ready', 'In Progress', 'Done', 'Archived'];

export { parseRange };

export interface TaskDto {
  title?: string;
  description?: string;
  status?: string;
}

export const items = () => tasks;

export const validate = (
  dto: TaskDto = {},
  options: { partial?: boolean } = {},
): string[] => {
  const problems = validateFields(dto as Record<string, unknown>, { required: ['title', 'description'], ...options });
  if (dto.status !== undefined && !STATUSES.includes(dto.status)) {
    problems.push(`status должен быть одним из: ${STATUSES.join(', ')}`);
  }
  return problems;
};

export const build = (dto: TaskDto) => ({
  id: nextId(tasks),
  title: dto.title,
  description: dto.description,
  status: dto.status ?? 'Backlog',
});

export const list = (
  { skip = 0, limit = 30, select }: { skip?: number; limit?: number; select?: string | string[] } = {},
) => page({
  items: tasks, envelope: 'tasks', skip, limit, fields: parseSelect(select),
});

export const find = (id: string | number | undefined) => findById(tasks, id);
