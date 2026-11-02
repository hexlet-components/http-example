import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
  apps,
  currentAccount,
  endSession,
  findAccount,
  html,
  layout,
  redirectWithFlash,
  startSession,
} from './ui-pages.ts';

// Всё, что у курса Playwright на Python есть помимо страниц: API табло и
// бронирований, вход через API, раздел сотрудника, скачивания. Уроки цитируют
// поля ответов и надписи дословно, поэтому данные здесь это текст курса.
//
// Набор данных не меняется, как и у остального сервера: POST, PUT, PATCH и
// DELETE отвечают так, будто изменение случилось, но следующий GET отдаёт
// прежний набор. Стенд общий, и запрос одного студента не должен менять то,
// что видит другой.

const prefix = '/python-playwright';
const app = apps['python-playwright'];

export const departures = [
  { flight: 'SK 204', destination: 'Lisbon', departure: '2026-01-15T08:30:00Z', status: 'On time', gate: 'B12' },
  { flight: 'SK 318', destination: 'Oslo', departure: '2026-01-15T09:10:00Z', status: 'Boarding', gate: 'A3' },
  { flight: 'SK 527', destination: 'Istanbul', departure: '2026-01-15T11:45:00Z', status: 'Delayed', gate: 'C7' },
  { flight: 'SK 611', destination: 'Rome', departure: '2026-01-15T13:20:00Z', status: 'Cancelled', gate: 'B4' },
];

export const bookings = [
  { id: 1, flight: 'SK 204', passenger: 'Anna Berg', seat: '14A', status: 'confirmed' },
  { id: 2, flight: 'SK 318', passenger: 'Mark Olsen', seat: '3C', status: 'confirmed' },
];

// Токен пишется в уроке, поэтому он постоянный: имя учётки и суффикс.
const tokenOf = (username: string) => `${username}-token`;

const passengers = [
  { name: 'Anna Berg', flight: 'SK 204', seat: '14A' },
  { name: 'Mark Olsen', flight: 'SK 318', seat: '3C' },
  { name: 'Lena Novak', flight: 'SK 527', seat: '21F' },
];

// Минимальный PDF из одной пустой страницы: браузер скачивает его как файл, а
// урок проверяет имя и непустой размер.
const boardingPassPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] >> endobj
trailer << /Root 1 0 R >>
%%EOF
`;

const tripsCsv = `flight,destination,seat
SK 204,Lisbon,14A
`;

const authorized = (req: FastifyRequest) => {
  const header = req.headers.authorization ?? '';
  const accounts = [app.credentials, ...(app.extraAccounts ?? []).filter((account) => !account.locked)];
  return accounts.some((account) => header === `Bearer ${tokenOf(account.username)}`);
};

const requireToken = (req: FastifyRequest, res: FastifyReply) => {
  if (authorized(req)) return true;
  res.code(401).send({ error: 'Missing or invalid token' });
  return false;
};

const findBooking = (req: FastifyRequest, res: FastifyReply) => {
  const { id } = req.params as { id: string };
  const booking = bookings.find((item) => String(item.id) === id);
  if (!booking) res.code(404).send({ error: 'Booking not found' });
  return booking;
};

const page = (body: string) => layout(app, prefix, body);

export default async function setUpPythonPlaywright(server: FastifyInstance) {
  // Табло грузит рейсы этим запросом, и урок про моки подменяет именно его.
  server.get(`${prefix}/api/departures`, (req) => {
    const { status } = req.query as { status?: string };
    if (!status) return departures;
    return departures.filter((item) => item.status.toLowerCase() === status.toLowerCase());
  });

  server.post(`${prefix}/api/login`, (req, res) => {
    const { username = '', password = '' } = (req.body ?? {}) as Record<string, string>;
    const account = findAccount(app, username, password);
    if (!account || account.locked) {
      return res.code(401).send({ error: 'Wrong username or password' });
    }
    // Вход через API открывает и сессию браузера: урок переносит куки из
    // APIRequestContext в контекст браузера через storage_state.
    startSession(res, account.username, prefix);
    return { token: tokenOf(account.username) };
  });

  server.get(`${prefix}/api/bookings`, (req, res) => {
    if (!requireToken(req, res)) return res;
    return bookings;
  });

  server.get(`${prefix}/api/bookings/:id`, (req, res) => {
    if (!requireToken(req, res)) return res;
    return findBooking(req, res) ?? res;
  });

  server.post(`${prefix}/api/bookings`, (req, res) => {
    if (!requireToken(req, res)) return res;
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body.flight || !body.passenger) {
      return res.code(422).send({ error: 'Fields flight and passenger are required' });
    }
    return res.code(201).send({ id: bookings.length + 1, seat: null, ...body, status: 'confirmed' });
  });

  for (const method of ['put', 'patch'] as const) {
    server[method](`${prefix}/api/bookings/:id`, (req, res) => {
      if (!requireToken(req, res)) return res;
      const booking = findBooking(req, res);
      if (!booking) return res;
      return { ...booking, ...(req.body as object), id: booking.id };
    });
  }

  server.delete(`${prefix}/api/bookings/:id`, (req, res) => {
    if (!requireToken(req, res)) return res;
    if (!findBooking(req, res)) return res;
    return res.code(204).send();
  });

  server.get(`${prefix}/staff`, (req, res) => {
    const account = currentAccount(req, app, prefix);
    if (!account) {
      return redirectWithFlash(res, prefix, '/login', 'error', app.texts.mustLogIn);
    }
    if (account.username !== 'agent') {
      return html(
        res.code(403),
        page(
          `    <main class="example">\n      <h2>Access denied</h2>\n      <p>Only airline staff can see the passenger list.</p>\n    </main>`,
        ),
      );
    }
    const rows = passengers
      .map(
        (item) =>
          `          <tr><td>${item.name}</td><td>${item.flight}</td><td>${item.seat}</td><td><button type="button" class="remove">Remove</button></td></tr>`,
      )
      .join('\n');
    return html(
      res,
      page(`    <main class="example">
      <h2>Passenger list</h2>
      <table id="passengers">
        <thead>
          <tr><th>Passenger</th><th>Flight</th><th>Seat</th><th></th></tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <a class="button" href="${prefix}/logout">Logout</a>
    </main>
    <script>
      // Удаление только из таблицы на странице: список на сервере не меняется.
      for (const button of document.querySelectorAll('.remove')) {
        button.addEventListener('click', () => button.closest('tr').remove());
      }
    </script>`),
    );
  });

  server.get(`${prefix}/session-expired`, (_req, res) => {
    endSession(res, prefix);
    return redirectWithFlash(res, prefix, '/login', 'error', 'Your session expired.');
  });

  server.get(`${prefix}/boarding-pass.pdf`, (_req, res) =>
    res
      .type('application/pdf')
      .header('content-disposition', 'attachment; filename="boarding-pass.pdf"')
      .send(boardingPassPdf),
  );

  server.get(`${prefix}/trips.csv`, (_req, res) =>
    res
      .type('text/csv; charset=utf-8')
      .header('content-disposition', 'attachment; filename="trips.csv"')
      .send(tripsCsv),
  );
}
