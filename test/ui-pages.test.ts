import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { apps } from '../custom-server/src/ui-pages.ts';
import { buildApp, createClient } from './helpers.ts';

let app: FastifyInstance;
let client: ReturnType<typeof createClient>;

beforeAll(async () => {
  app = await buildApp();
  client = createClient(app);
});

afterAll(() => app.close());

// Куки из ответа в виде заголовка Cookie для следующего запроса.
const cookieHeader = (headers: Record<string, any>) =>
  [headers['set-cookie']]
    .flat()
    .filter(Boolean)
    .map((cookie: string) => cookie.split(';')[0])
    .join('; ');

const logIn = (prefix: string, username: string, password: string) =>
  client.send(`${prefix}/authenticate`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams({ username, password }).toString(),
  });

const courses = Object.entries(apps).map(([course, ui]) => ({ prefix: `/${course}`, ui }));

// Уроки ищут эти элементы и тексты дословно.
const pages: [string, string[]][] = [
  ['/java-selenium', ['<title>City Library</title>', '<h1 class="heading">City Library</h1>']],
  ['/java-selenium/covers', ['class="figure"', '<h5>Moby Dick</h5>']],
  ['/java-selenium/shelves', ['id="book-moby-dick"', 'id="shelf-reading"']],
  ['/java-selenium/search', ['id="search"', 'id="result"']],
  ['/java-selenium/return', ['id="return-book"']],
  ['/java-selenium/preview', ['target="_blank">Open preview</a>']],
  ['/java-selenium/preview/moby-dick', ['<h3>Moby Dick: preview</h3>']],
  ['/java-selenium/reader', ['name="chapter"']],
  ['/java-selenium/reader/chapter', ['<p id="content">Call me Ishmael.</p>']],
  ['/python-selenium', ['<title>Task Board</title>', '<h1 class="heading">Task Board</h1>', '>Sign in</a>']],
  ['/python-playwright', ['<title>Departures</title>', 'id="departures"', '>My trips</a>']],
];

describe('страницы приложений', () => {
  it.each(pages)('%s', async (url, fragments) => {
    const reply = await client.send(url);
    expect(reply.status).toBe(200);
    for (const fragment of fragments) {
      expect(reply.body).toContain(fragment);
    }
    expect(reply.body).not.toContain('{{prefix}}');
  });

  it('стиль страниц отдаётся статикой', async () => {
    expect((await client.send('/assets/ui-pages/style.css')).status).toBe(200);
  });
});

describe.each(courses)('вход и закрытый раздел $prefix', ({ prefix, ui }) => {
  const { credentials, texts } = ui;
  const secure = `${prefix}${ui.securePath}`;

  it('страница входа', async () => {
    const reply = await client.send(`${prefix}/login`);
    expect(reply.status).toBe(200);
    for (const fragment of [
      `<h2>${texts.loginHeading}</h2>`,
      'form id="login"',
      '<label for="username">Username</label>',
      'id="password"',
      'class="primary" type="submit" data-test="login-button"',
    ]) {
      expect(reply.body).toContain(fragment);
    }
  });

  it('без сессии закрытый раздел уводит на вход с сообщением', async () => {
    const reply = await client.send(secure);
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe(`${prefix}/login`);

    const login = await client.send(`${prefix}/login`, { headers: { cookie: cookieHeader(reply.headers) } });
    expect(login.body).toContain(`<div id="flash" class="flash error">${texts.mustLogIn}</div>`);
  });

  it('неверный пароль возвращает на вход', async () => {
    const reply = await logIn(prefix, credentials.username, 'wrong');
    expect(reply.headers.location).toBe(`${prefix}/login`);

    const login = await client.send(`${prefix}/login`, { headers: { cookie: cookieHeader(reply.headers) } });
    expect(login.body).toContain(texts.invalid);
  });

  it('верная учётка открывает закрытый раздел, выход закрывает его', async () => {
    const reply = await logIn(prefix, credentials.username, credentials.password);
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe(secure);

    const cookie = cookieHeader(reply.headers);
    const page = await client.send(secure, { headers: { cookie } });
    expect(page.status).toBe(200);
    expect(page.body).toContain(`<h2>${texts.secureHeading}</h2>`);
    expect(page.body).toContain(`<div id="flash" class="flash success">${texts.loggedIn}</div>`);
    expect(page.body.split(`href="${prefix}/logout"`)).toHaveLength(2);
    expect(page.body).toContain('id="menu-button"');

    const logout = await client.send(`${prefix}/logout`, { headers: { cookie } });
    expect(logout.headers.location).toBe(`${prefix}/login`);
    expect(String(logout.headers['set-cookie'])).toContain('ui-session=;');
  });

  it('подделанная сессия не открывает закрытый раздел', async () => {
    const reply = await client.send(secure, { headers: { cookie: `ui-session=${credentials.username}` } });
    expect(reply.status).toBe(302);
  });
});

describe('курсы не делят сессию', () => {
  it('вход в одном курсе не открывает закрытый раздел другого', async () => {
    const [first, second] = courses;
    const reply = await logIn(first.prefix, first.ui.credentials.username, first.ui.credentials.password);
    expect(String(reply.headers['set-cookie'])).toContain(`Path=${first.prefix}`);

    const page = await client.send(`${second.prefix}${second.ui.securePath}`, {
      headers: { cookie: cookieHeader(reply.headers) },
    });
    expect(page.status).toBe(302);
  });
});
