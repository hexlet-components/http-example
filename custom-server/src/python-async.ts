import type { FastifyInstance } from 'fastify';

// Маршруты курса «Асинхронность в Python». Ответы цитирует урок «Асинхронные
// HTTP-запросы» курса python_asynchronous_programming_course, поэтому данные это
// текст курса. Набор фиксирован и состояния нет: запросы студентов не влияют друг
// на друга.

const prefix = '/python-async';

export const books = [
  { id: 1, title: 'Python' },
  { id: 2, title: 'Asyncio' },
];

export default async function setUpPythonAsync(server: FastifyInstance) {
  server.get(prefix, (_req, res) => res.sendFile('python-async/index.html'));

  server.get(`${prefix}/books/:id`, (req, res) => {
    const { id } = req.params as { id: string };
    const book = books.find((item) => String(item.id) === id);
    if (!book) return res.code(404).send({ error: 'Book not found' });
    return book;
  });
}
