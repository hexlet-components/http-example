import { randomBytes } from 'node:crypto';

// Данные отдельного опыта не меняют общие учебные коллекции. Хранилище ограничено
// по числу опытов и сроку жизни, чтобы публичный стенд не накапливал данные.
export function createDemoStore<T>() {
  const records = new Map<string, { value: T; expires: number }>();
  return {
    create(value: T) {
      const now = Date.now();
      for (const [id, record] of records) if (record.expires <= now) records.delete(id);
      if (records.size >= 1000) return null;
      const id = randomBytes(12).toString('hex');
      records.set(id, { value, expires: now + 30 * 60 * 1000 });
      return id;
    },
    get(id: string) {
      const record = records.get(id);
      if (!record) return undefined;
      if (record.expires <= Date.now()) {
        records.delete(id);
        return undefined;
      }
      return record.value;
    },
  };
}

export const DEMO_ORIGIN = 'https://http.hexlet.app';
export interface DemoParams {
  id: string;
}
