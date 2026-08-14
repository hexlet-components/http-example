// Посты демонстрационного сервера.
//
// Данные на английском намеренно: сервер один на все локали курсов, см. шапку
// data/tasks.js.
//
// Их сорок, и число выбрано под урок example: он учит пагинации на запросе
// `?skip=30`, а значит записей должно быть заметно больше тридцати. Сорок дают
// последнюю страницу из десяти записей.
//
// Авторы распределены неравномерно, и у автора 1 их восемь: урок показывает
// вложенный ресурс `/users/1/posts`, и на пустом или однозаписочном списке он
// ничего не объясняет.
export default [
  { id: 1, authorId: 1, title: 'How HTTP works', body: 'Taking a request and a response apart: request line, headers, body' },
  { id: 2, authorId: 1, title: 'Status codes in practice', body: 'How 401 differs from 403 and why 404 shows up more often than the rest' },
  { id: 3, authorId: 1, title: 'REST and RPC', body: 'The same list of tasks served in two different ways' },
  { id: 4, authorId: 2, title: 'Headers people forget', body: 'Content-Type, Accept and why the server answers with something else' },
  { id: 5, authorId: 3, title: 'Idempotency in plain words', body: 'Why a repeated PUT is safe and a repeated POST is not' },
  { id: 6, authorId: 1, title: 'Pagination with skip and limit', body: 'Serving long lists in parts and why the response carries total' },
  { id: 7, authorId: 4, title: 'Caching responses', body: 'ETag, Last-Modified and conditional requests on a live example' },
  { id: 8, authorId: 2, title: 'Authentication versus authorization', body: 'Who you are and what you may do: two problems, two mechanisms' },
  { id: 9, authorId: 5, title: 'A bearer token from the inside', body: 'Where the token comes from, where it lives and what to do when it expires' },
  { id: 10, authorId: 1, title: 'JWT is signed, not encrypted', body: 'Anyone can read the payload, the signature is what stops forgery' },
  { id: 11, authorId: 6, title: 'OAuth without magic', body: 'Trading the code for a token step by step, from both sides' },
  { id: 12, authorId: 3, title: 'API versions: path or header', body: 'Where to put the version and what it costs the clients' },
  { id: 13, authorId: 7, title: 'OpenAPI as a contract', body: 'Specification before code and what both sides get out of it' },
  { id: 14, authorId: 2, title: 'Validation at the boundary', body: 'Why 422 is more useful than a handler that crashed' },
  { id: 15, authorId: 8, title: 'Errors in the response body', body: 'A problem document instead of a bare status code: RFC 7807 in practice' },
  { id: 16, authorId: 1, title: 'CORS: whose request is this', body: 'The preflight request, the headers and the usual frontend traps' },
  { id: 17, authorId: 4, title: 'Uploading files through an API', body: 'Multipart against handing the client a direct upload URL' },
  { id: 18, authorId: 9, title: 'Rate limiting', body: 'Windows, quotas and the headers that tell the client where the limit is' },
  { id: 19, authorId: 5, title: 'Webhooks instead of polling', body: 'How the server reports an event and what to do about duplicates' },
  { id: 20, authorId: 2, title: 'Soft deletes', body: 'When a record has to be hidden rather than lost' },
  { id: 21, authorId: 10, title: 'Filtering and sorting lists', body: 'Conventions for query parameters that do not turn into a mess' },
  { id: 22, authorId: 3, title: 'Partial updates', body: 'PATCH and why it is not a PUT with half of the fields' },
  { id: 23, authorId: 6, title: 'Nested resources', body: 'When /users/1/posts reads better than a filter by author' },
  { id: 24, authorId: 1, title: 'Choosing response fields', body: 'The select parameter and saving on data nobody asked for' },
  { id: 25, authorId: 7, title: 'HTTP/2 and many requests', body: 'What changed for the client and why bundling assets is history' },
  { id: 26, authorId: 4, title: 'Timeouts and retries', body: 'A client that does not wait forever and a server that expects retries' },
  { id: 27, authorId: 8, title: 'Request logs without the noise', body: 'What to write to be able to debug and what never to write at all' },
  { id: 28, authorId: 5, title: 'Testing an API', body: 'Contract checks, mocks and why unit tests alone are not enough' },
  { id: 29, authorId: 9, title: 'Documentation people actually use', body: 'Example requests matter more than field descriptions' },
  { id: 30, authorId: 2, title: 'Cursor pagination', body: 'When skip stops working and what replaces it' },
  { id: 31, authorId: 10, title: 'Bulk operations', body: 'One request for many records and what to answer on partial success' },
  { id: 32, authorId: 3, title: 'Long running operations', body: 'Answering 202, handing out a status URL and polling for the result' },
  { id: 33, authorId: 6, title: 'Date format in responses', body: 'ISO 8601, time zones and arguments that can be avoided' },
  { id: 34, authorId: 7, title: 'Numbers and money', body: 'Why an amount should not travel as a floating point number' },
  { id: 35, authorId: 1, title: 'Staying compatible while changing', body: 'What can be added safely and what breaks existing clients' },
  { id: 36, authorId: 4, title: 'GraphQL next to REST', body: 'Where a schema query wins and where plain endpoints do' },
  { id: 37, authorId: 8, title: 'Request size limits', body: 'Status 413, sensible limits and messages that explain them' },
  { id: 38, authorId: 5, title: 'Service health', body: 'Readiness and liveness checks and how they differ' },
  { id: 39, authorId: 9, title: 'Tracing a request', body: 'A request id that travels through every service on the way' },
  { id: 40, authorId: 10, title: 'Retiring an old endpoint', body: 'A warning, a deadline and the Deprecation header' },
];
