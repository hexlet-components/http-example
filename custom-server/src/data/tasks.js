// Набор задач, который отдаёт JSON-RPC эндпоинт.
//
// Те же самые задачи приведены примерами в спецификации, в моделях Task и Tasks
// (typespec/http-api/models/task.tsp), откуда их берёт статичный мок prism для
// REST-маршрутов /tasks. Урок kinds курса http-api сравнивает REST и RPC на
// одних и тех же данных, поэтому расхождение между этими двумя местами ломает
// урок. Совпадение проверяется прогоном bin/smoke-test.js, то есть правка
// здесь без правки спецификации свалит `make test`.
export default [
  {
    id: 1,
    title: 'Опубликовать курс по основам JavaScript',
    description: 'Автор подготовил курс по JavaScript. Нужно его опубликовать',
    status: 'Backlog',
  },
  {
    id: 2,
    title: 'Записать скринкаст про HTTP API',
    description: 'Показать, чем REST отличается от RPC',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'Обновить документацию',
    description: 'Описать эндпоинт /rpc в спецификации',
    status: 'Done',
  },
];
