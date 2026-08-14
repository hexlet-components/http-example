// Задачи, которые отдают REST-маршруты и JSON-RPC.
//
// Данные на английском намеренно: сервер один на все локали курсов, и русский
// текст в ответах читался бы как ошибка у испанского или английского студента.
// По той же причине на латинице пользователи, посты и комментарии.
//
// Те же самые задачи приведены примерами в спецификации, в моделях Task и Tasks
// (typespec/http-api/models/task.tsp), откуда их берёт документация. Урок kinds
// курса http-api сравнивает REST и RPC на одних и тех же данных, поэтому
// расхождение между этими двумя местами ломает урок. Совпадение проверяется
// прогоном bin/smoke-test.js.
export default [
  {
    id: 1,
    title: 'Publish the JavaScript basics course',
    description: 'The author has prepared the course, it is ready to be published',
    status: 'Backlog',
  },
  {
    id: 2,
    title: 'Record a screencast about HTTP API',
    description: 'Show how REST differs from RPC',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'Update the documentation',
    description: 'Describe the /rpc endpoint in the specification',
    status: 'Done',
  },
];
