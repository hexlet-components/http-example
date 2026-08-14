// Курсы демонстрационного сервера.
//
// Данные на английском намеренно, см. шапку data/tasks.js.
//
// Ресурс закрыт заголовком X-API-KEY, а не Bearer-токеном: урок authentication
// сравнивает на нём два способа аутентификации и просит сделать два запроса,
// без ключа и с ключом. Первые три записи приведены примерами в спецификации
// (typespec/http-api/models/course.tsp).
//
// Их десять, чтобы страница с `?limit=3` отличалась от полного списка: раньше
// ресурс отдавал мок, и на нём параметры не работали вовсе.
export default [
  { id: 1, title: 'HTTP API', description: 'Designing and calling APIs over HTTP' },
  { id: 2, title: 'The HTTP protocol', description: 'Requests, responses, status codes and headers' },
  { id: 3, title: 'JavaScript basics', description: 'A first programming language from scratch' },
  { id: 4, title: 'Git and GitHub', description: 'Project history, branches and working together' },
  { id: 5, title: 'SQL basics', description: 'Queries against a relational database' },
  { id: 6, title: 'Introduction to Docker', description: 'Containers, images and running an application' },
  { id: 7, title: 'Testing code', description: 'Unit tests and dealing with failures' },
  { id: 8, title: 'Python basics', description: 'Syntax, data types and functions' },
  { id: 9, title: 'Algorithms and data structures', description: 'Complexity and picking the right structure' },
  { id: 10, title: 'Web application security', description: 'Common attacks and the defences against them' },
];
