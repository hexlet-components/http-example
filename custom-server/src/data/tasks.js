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
//
// Задач двадцать, и уменьшать набор нельзя: самостоятельная работа урока
// example просит выполнить запрос с `skip=5` и `limit=10`. На трёх задачах он
// отдавал пустой список, и пагинацию на нём было не увидеть, хотя параметры
// применялись честно. Первые три задачи приведены в уроке kinds дословно.
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
  {
    id: 4,
    title: 'Check the code examples in the lessons',
    description: 'Run every example and make sure it still works',
    status: 'Ready',
  },
  {
    id: 5,
    title: 'Translate the authentication section',
    description: 'Three lessons are waiting for a Spanish translation',
    status: 'Backlog',
  },
  {
    id: 6,
    title: 'Build and publish the image',
    description: 'Build the application image and push it to the registry',
    status: 'Done',
  },
  {
    id: 7,
    title: 'Add response examples to the specification',
    description: 'Every model needs an example, otherwise the docs are empty',
    status: 'In Progress',
  },
  {
    id: 8,
    title: 'Go through the support inbox',
    description: 'Collect the questions students keep asking this week',
    status: 'Ready',
  },
  {
    id: 9,
    title: 'Fix the link to the documentation',
    description: 'The API testing lesson points at an address that does not exist',
    status: 'Backlog',
  },
  {
    id: 10,
    title: 'Update the dependencies',
    description: 'Bump the package versions and run the tests',
    status: 'Done',
  },
  {
    id: 11,
    title: 'Write the exercise for the RPC lesson',
    description: 'The student has to compare REST and RPC on the same data',
    status: 'Archived',
  },
  {
    id: 12,
    title: 'Draw the request and response diagram',
    description: 'The diagram belongs in the lesson text, not in a picture',
    status: 'Ready',
  },
  {
    id: 13,
    title: 'Verify the response codes',
    description: 'Make sure 404, 405 and 422 arrive where the lessons promise them',
    status: 'In Progress',
  },
  {
    id: 14,
    title: 'Prepare the demo data set',
    description: 'Ten users and forty posts instead of random values',
    status: 'Done',
  },
  {
    id: 15,
    title: 'Describe pagination in the documentation',
    description: 'Explain the skip and limit parameters and their defaults',
    status: 'Backlog',
  },
  {
    id: 16,
    title: 'Agree the course outline with the editor',
    description: 'Settle the order of the lessons and the size of each one',
    status: 'Ready',
  },
  {
    id: 17,
    title: 'Migrate the old lessons to the new format',
    description: 'Seven lessons still use a format that is no longer supported',
    status: 'Archived',
  },
  {
    id: 18,
    title: 'Show a request without the token',
    description: 'Demonstrate what happens without the Authorization header',
    status: 'In Progress',
  },
  {
    id: 19,
    title: 'Collect feedback about the course',
    description: 'Ask the students who reached the last lesson',
    status: 'Backlog',
  },
  {
    id: 20,
    title: 'Ship the update to production',
    description: 'Pull the new image on the server and check the endpoints',
    status: 'Ready',
  },
];
