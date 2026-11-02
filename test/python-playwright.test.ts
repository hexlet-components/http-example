import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { bookings, departures } from '../custom-server/src/python-playwright.ts';
import { buildApp, createClient } from './helpers.ts';

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

const prefix = '/python-playwright';

const cookieHeader = (headers: Record<string, any>) =>
  [headers['set-cookie']]
    .flat()
    .filter(Boolean)
    .map((cookie: string) => cookie.split(';')[0])
    .join('; ');

const logIn = (username: string, password: string) =>
  client.send(`${prefix}/authenticate`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams({ username, password }).toString(),
  });

const flashAfter = async (headers: Record<string, any>) =>
  (await client.send(`${prefix}/login`, { headers: { cookie: cookieHeader(headers) } })).body as string;

const bearer = (username: string) => ({ authorization: `Bearer ${username}-token` });

// Уроки курса Playwright на Python ищут эти элементы и надписи дословно.
const pages: [string, string[]][] = [
  [
    '',
    [
      'id="departures"',
      'data-testid="current-time"',
      'title="Flights today"',
      '<aside aria-label="Travel alerts">',
      '<p id="empty" hidden>No departures right now.</p>',
      `fetch('${prefix}/api/departures')`,
    ],
  ],
  ['/packing', ['placeholder="What do you need to pack?"', 'data-testid="item-title"', 'data-testid="items-left"']],
  [
    '/check-in',
    [
      '<label for="first-name">First name</label>',
      'placeholder="name@example.com"',
      '<label for="seat">Seat preference</label>',
      '<select id="assistance" multiple>',
      'aria-haspopup="listbox"',
      '<li role="option" aria-selected="false">Vegetarian</li>',
      '<legend>Cabin class</legend>',
      'I accept the terms',
      '<label for="passport">Passport scan</label>',
      'data-testid="check-in"',
      'Baggage allowance: 23 kg',
    ],
  ],
  [
    '/boarding-pass',
    [
      '>Download boarding pass</a>',
      '>Export trips (CSV)</a>',
      'target="_blank">Airport map</a>',
      "confirm('Cancel your check-in?')",
      "prompt('Companion name')",
      `<iframe id="payment" title="Payment" src="${prefix}/payment">`,
      'id="attach-visa"',
    ],
  ],
  ['/airport-map', ["document.title = 'Airport map'", '>Close</button>']],
  ['/extras', ['<h3>Priority boarding</h3>', '>Add to trip</button>', 'data-testid="extras-count"', "'WINTER26'"]],
];

describe('страницы Departures', () => {
  it.each(pages)('%s', async (route, fragments) => {
    const reply = await client.send(`${prefix}${route}`);
    expect(reply.status).toBe(200);
    for (const fragment of [...fragments, '<nav aria-label="Main">', '>Navigation</button>', 'alt="Departures logo"']) {
      expect(reply.body).toContain(fragment);
    }
    expect(reply.body).not.toContain('{{prefix}}');
  });

  it('фрейм оплаты отдаётся без шапки', async () => {
    const reply = await client.send(`${prefix}/payment`);
    expect(reply.body).toContain('<label for="card">Card number</label>');
    expect(reply.body).toContain('>Pay 25 EUR</button>');
    expect(reply.body).not.toContain('<nav');
  });

  it('логотип отдаётся статикой', async () => {
    expect((await client.send('/assets/ui-pages/python-playwright/logo.svg')).status).toBe(200);
  });
});

describe('вход Departures', () => {
  it('поля входа найдутся по плейсхолдеру', async () => {
    const reply = await client.send(`${prefix}/login`);
    expect(reply.body).toContain('placeholder="Username"');
    expect(reply.body).toContain('placeholder="Password"');
  });

  it.each([
    ['', 'flight123', 'Username is required.'],
    ['passenger', '', 'Password is required.'],
    ['blocked', 'flight123', 'This account is locked.'],
    ['passenger', 'wrong', 'Wrong username or password.'],
  ])('%s / %s: %s', async (username, password, message) => {
    const reply = await logIn(username, password);
    expect(reply.headers.location).toBe(`${prefix}/login`);
    expect(await flashAfter(reply.headers)).toContain(`<div id="flash" class="flash error">${message}</div>`);
  });

  it('пассажир попадает в свои поездки, токен ложится в localStorage', async () => {
    const reply = await logIn('passenger', 'flight123');
    expect(reply.headers.location).toBe(`${prefix}/trips`);
    const trips = await client.send(`${prefix}/trips`, { headers: { cookie: cookieHeader(reply.headers) } });
    expect(trips.body).toContain("localStorage.setItem('auth_token', 'passenger-token')");
    expect(trips.body).toContain('<ul aria-label="Flight updates">');
    expect(trips.body).toContain(`location.assign('${prefix}/session-expired')`);
  });

  it('сотрудник попадает в список пассажиров, пассажиру он закрыт', async () => {
    const agent = await logIn('agent', 'staff123');
    expect(agent.headers.location).toBe(`${prefix}/staff`);
    const staff = await client.send(`${prefix}/staff`, { headers: { cookie: cookieHeader(agent.headers) } });
    expect(staff.status).toBe(200);
    expect(staff.body).toContain('<h2>Passenger list</h2>');
    expect(staff.body).toContain('<td>Lena Novak</td>');

    const passenger = await logIn('passenger', 'flight123');
    const denied = await client.send(`${prefix}/staff`, { headers: { cookie: cookieHeader(passenger.headers) } });
    expect(denied.status).toBe(403);
    expect(denied.body).toContain('<h2>Access denied</h2>');

    const anonymous = await client.send(`${prefix}/staff`);
    expect(anonymous.headers.location).toBe(`${prefix}/login`);
  });

  it('истёкшая сессия закрывает вход и объясняет причину', async () => {
    const reply = await client.send(`${prefix}/session-expired`);
    expect(reply.headers.location).toBe(`${prefix}/login`);
    expect(String(reply.headers['set-cookie'])).toContain('ui-session=;');
    expect(await flashAfter(reply.headers)).toContain('Your session expired.');
  });
});

describe('API Departures', () => {
  it('табло отдаёт рейсы и фильтрует их по статусу', async () => {
    expect((await client.send(`${prefix}/api/departures`)).body).toEqual(departures);
    const delayed = await client.send(`${prefix}/api/departures?status=delayed`);
    expect(delayed.body).toEqual([expect.objectContaining({ flight: 'SK 527', status: 'Delayed' })]);
  });

  it('вход через API отдаёт токен и открывает сессию браузера', async () => {
    const reply = await client.json(`${prefix}/api/login`, 'POST', { username: 'passenger', password: 'flight123' });
    expect(reply.body).toEqual({ token: 'passenger-token' });
    const trips = await client.send(`${prefix}/trips`, { headers: { cookie: cookieHeader(reply.headers) } });
    expect(trips.status).toBe(200);

    const wrong = await client.json(`${prefix}/api/login`, 'POST', { username: 'blocked', password: 'flight123' });
    expect(wrong.status).toBe(401);
  });

  it('бронирования закрыты токеном', async () => {
    expect((await client.send(`${prefix}/api/bookings`)).status).toBe(401);
    const list = await client.send(`${prefix}/api/bookings`, { headers: bearer('passenger') });
    expect(list.body).toEqual(bookings);
    const one = await client.send(`${prefix}/api/bookings/2`, { headers: bearer('agent') });
    expect(one.body).toEqual(bookings[1]);
    expect((await client.send(`${prefix}/api/bookings/99`, { headers: bearer('agent') })).status).toBe(404);
    expect((await client.send(`${prefix}/api/bookings`, { headers: bearer('blocked') })).status).toBe(401);
  });

  it('изменения отвечают кодами, но набор бронирований остаётся прежним', async () => {
    const created = await client.json(
      `${prefix}/api/bookings`,
      'POST',
      { flight: 'SK 527', passenger: 'Ivan Petrov' },
      bearer('passenger'),
    );
    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      id: 3,
      seat: null,
      flight: 'SK 527',
      passenger: 'Ivan Petrov',
      status: 'confirmed',
    });

    const invalid = await client.json(`${prefix}/api/bookings`, 'POST', { flight: 'SK 527' }, bearer('passenger'));
    expect(invalid.status).toBe(422);

    const patched = await client.json(`${prefix}/api/bookings/1`, 'PATCH', { seat: '2A' }, bearer('passenger'));
    expect(patched.body).toEqual({ ...bookings[0], seat: '2A' });
    const put = await client.json(`${prefix}/api/bookings/1`, 'PUT', { seat: '3B' }, bearer('passenger'));
    expect(put.body.seat).toBe('3B');

    const deleted = await client.send(`${prefix}/api/bookings/1`, { method: 'DELETE', headers: bearer('passenger') });
    expect(deleted.status).toBe(204);

    const list = await client.send(`${prefix}/api/bookings`, { headers: bearer('passenger') });
    expect(list.body).toHaveLength(2);
    expect(list.body[0].seat).toBe('14A');
  });
});

describe('скачивания Departures', () => {
  it.each([
    ['/boarding-pass.pdf', 'application/pdf', 'boarding-pass.pdf'],
    ['/trips.csv', 'text/csv', 'trips.csv'],
  ])('%s', async (route, type, filename) => {
    const reply = await client.send(`${prefix}${route}`);
    expect(reply.status).toBe(200);
    expect(reply.headers['content-type']).toContain(type);
    expect(reply.headers['content-disposition']).toBe(`attachment; filename="${filename}"`);
    expect(String(reply.body).length).toBeGreaterThan(0);
  });
});
