// Общий слой для коллекций демонстрационного сервера.
//
// Раньше все коллекции отдавал мок prism из примеров спецификации. Мок
// возвращает пример дословно, поэтому `skip`, `limit` и `select` не применялись,
// а `/users/1/posts` отдавал тот же список, что `/posts`. Уроки курса http-api
// учат ровно на этих параметрах, поэтому коллекции обслуживаются кодом
// (FEEDBACK-166, FEEDBACK-371).
//
// Здесь только разбор параметров и выборка. Маршруты и коды ответов лежат в
// routes.js, данные в data/, а один и тот же список задач берёт отсюда же и
// JSON-RPC, чтобы REST и RPC не расходились.

export const DEFAULT_LIMIT = 30;

export interface Identified {
  id: number;
}

export interface Range {
  skip: number;
  limit: number;
}

type Param = string | number | null | undefined;

// null означает «значение есть, но негодное». Вызывающий сам решает, каким кодом
// или ошибкой на это ответить: у REST это 422, у JSON-RPC код -32602.
export const parseRange = ({ skip, limit }: { skip?: Param; limit?: Param } = {}): Range | null => {
  const parse = (value: Param, fallback: number): number | null => {
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

// select приходит либо строкой «firstName,email», либо повторяющимся параметром,
// и тогда fastify отдаёт массив. Обе формы приводятся к списку полей.
export const parseSelect = (select?: string | string[] | null): string[] | null => {
  if (select === undefined || select === null || select === '') return null;
  const raw = Array.isArray(select) ? select : [select];
  const fields = raw.flatMap((value) => String(value).split(',')).map((value) => value.trim());
  return fields.filter((field) => field.length > 0);
};

// Ключ остаётся в ответе всегда, даже если его не просили: без идентификатора
// запись бесполезна, и именно так параметр показан в уроке example.
// Поля идут в порядке модели, а не в порядке параметра: так ответ на
// `?select=firstName,email` совпадает с тем, что напечатано в уроке example, и в
// целом устойчив к порядку, в котором клиент перечислил поля.
export const project = <T extends Identified>(item: T, fields: string[] | null): Partial<T> => {
  if (fields === null) return item;
  const wanted = new Set(fields);
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => key === 'id' || wanted.has(key)),
  ) as Partial<T>;
};

// total это размер всего набора, а не выданной страницы: по нему клиент понимает,
// есть ли записи за пределами limit.
export const page = <T extends Identified>({
  items, envelope, skip, limit, fields = null,
}: {
  items: T[];
  envelope: string;
  skip: number;
  limit: number;
  fields?: string[] | null;
}) => ({
  [envelope]: items.slice(skip, skip + limit).map((item) => project(item, fields)),
  total: items.length,
  skip,
  limit,
});

export const findById = <T extends Identified>(items: T[], id: Param): T | undefined => items.find((item) => item.id === Number(id));

export const nextId = (items: Identified[]): number => items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

export const isFilled = (value: unknown): boolean => typeof value === 'string' && value.length > 0;

// Пустая строка не проходит: в спецификации у текстовых полей стоит @minLength(1).
export const validateFields = (
  dto: Record<string, unknown> = {},
  { required = [], optional = [], partial = false }: { required?: string[]; optional?: string[]; partial?: boolean } = {},
): string[] => {
  const problems: string[] = [];

  for (const field of required) {
    const value = dto[field];
    if (value === undefined) {
      if (!partial) problems.push(`${field} обязательно`);
      continue;
    }
    if (!isFilled(value)) problems.push(`${field} не может быть пустым`);
  }

  for (const field of optional) {
    const value = dto[field];
    if (value !== undefined && !isFilled(value)) {
      problems.push(`${field} не может быть пустым`);
    }
  }

  return problems;
};
