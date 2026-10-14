// Комментарии демонстрационного сервера.
//
// Данные на английском намеренно: сервер один на все локали курсов, см. шапку
// data/tasks.js.
//
// Разложены по первым десяти постам, по три на пост, чтобы вложенный ресурс
// `/posts/{postId}/comments` отдавал непустой и разный список у разных постов.
// Авторы взяты из users.js и не совпадают с автором поста.
const bodies = [
  'Thanks, headers finally make sense to me',
  'Where can I read more about this?',
  'The diagram is very clear, bookmarked it',
];

export default Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  authorId: ((index + 1) % 10) + 1,
  postId: Math.floor(index / 3) + 1,
  body: bodies[index % 3],
}));
