import { defineConfig } from 'vitest/config';

// Корень это корень репозитория: glue и документация читают спецификации по
// путям вида tsp-output/..., а они относительные. Поэтому перед тестами нужна
// скомпилированная спецификация (`mise run compile`).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
