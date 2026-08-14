import { defineConfig } from '@hey-api/openapi-ts';

// Типы обработчиков и моделей генерируются из той же спецификации, которую
// отдаёт документация курса. Сгенерированное лежит в репозитории, а не
// собирается на старте: образ не должен зависеть от генератора, а `make test`
// проверяет, что сгенерированное не отстало от спецификации.
//
// Имена в RouteHandlers это operationId из спецификации. Он там проставлен
// декоратором @operationId именно поэтому: fastify-openapi-glue ищет обработчик
// по operationId как есть, а Hey API приводит имя к camelCase. Без декоратора
// TypeSpec выдал бы TaskService_list против taskServiceList, и ни один
// обработчик не нашёлся бы.
export default defineConfig({
  input: './tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml',
  output: { path: './custom-server/src/generated' },
  plugins: ['fastify'],
});
