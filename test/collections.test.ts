import { describe, expect, it } from 'vitest';

import {
  page, parseRange, parseSelect, project,
} from '../custom-server/src/collections.ts';

describe('parseSelect', () => {
  it('пустое значение означает «все поля»', () => {
    expect(parseSelect(undefined)).toBeNull();
    expect(parseSelect('')).toBeNull();
  });

  it('разбирает строку и повторяющийся параметр', () => {
    expect(parseSelect('firstName, email')).toEqual(['firstName', 'email']);
    expect(parseSelect(['a,b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('project', () => {
  const item = { id: 1, a: 'x', b: 'y' };

  it('без списка полей отдаёт запись целиком', () => {
    expect(project(item, null)).toBe(item);
  });

  it('id остаётся всегда, порядок полей берётся из модели', () => {
    expect(Object.keys(project(item, ['b', 'a']))).toEqual(['id', 'a', 'b']);
    expect(project(item, ['b'])).toEqual({ id: 1, b: 'y' });
  });
});

describe('parseRange', () => {
  it('подставляет значения по умолчанию', () => {
    expect(parseRange({})).toEqual({ skip: 0, limit: 30 });
  });

  it('негодное значение даёт null', () => {
    expect(parseRange({ skip: -1 })).toBeNull();
    expect(parseRange({ limit: 'x' })).toBeNull();
    expect(parseRange({ skip: 1.5 })).toBeNull();
  });
});

describe('page', () => {
  it('total это размер всего набора, а не страницы', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(page({ items, envelope: 'items', skip: 1, limit: 1 })).toEqual({
      items: [{ id: 2 }], total: 3, skip: 1, limit: 1,
    });
  });
});
