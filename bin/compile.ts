// Компилирует спецификации TypeSpec в OpenAPI, по одной на приложение из
// app.config.json. Список приложений берётся оттуда же, откуда его читает
// сервер, поэтому новое приложение не приходится прописывать в двух местах.
//
// Отдельный скрипт, а не задача mise: его зовёт и образ, а mise в образ не
// ставится.
import { spawnSync } from 'node:child_process';

import appConfig from '../app.config.json' with { type: 'json' };

for (const name of appConfig.apps) {
  const { status } = spawnSync(
    'pnpm',
    ['exec', 'tsp', 'compile', `./typespec/${name}/main.tsp`, '--output-dir', `./tsp-output/${name}`],
    { stdio: 'inherit' },
  );
  if (status !== 0) {
    process.exit(status ?? 1);
  }
}
