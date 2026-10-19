import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { courses, credentials } from '../custom-server/src/ui-pages.ts';
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

// Уроки Selenium и Playwright ищут эти элементы и тексты дословно.
describe.each(courses.map((course) => `/${course}`))('страницы %s', (prefix) => {
  it.each([
    ['', ['<title>Hexlet UI Testing</title>', '<h1 class="heading">Welcome to UI testing</h1>', 'Form Authentication']],
    ['/hovers', ['class="figure"', '<h5>name: user1</h5>']],
    ['/drag_and_drop', ['id="column-a"', 'id="column-b"']],
    ['/key_presses', ['id="target"', 'id="result"']],
    ['/javascript_alerts', ['onclick="jsAlert()"', 'onclick="jsConfirm()"', 'onclick="jsPrompt()"']],
    ['/windows', ['target="_blank">Click Here</a>']],
    ['/windows/new', ['<h3>New Window</h3>']],
    ['/iframe', ['name="editor-frame"']],
    ['/iframe/content', ['id="content"']],
    [
      '/login',
      [
        '<h2>Login Page</h2>',
        'form id="login"',
        'id="username"',
        'id="password"',
        'type="submit" data-test="login-button"',
      ],
    ],
  ])('%s', async (url, fragments) => {
    const reply = await client.send(`${prefix}${url}`);
    expect(reply.status).toBe(200);
    for (const fragment of fragments) {
      expect(reply.body).toContain(fragment);
    }
  });

  it('стиль страниц отдаётся статикой', async () => {
    expect((await client.send('/assets/ui-pages/style.css')).status).toBe(200);
  });
});

describe.each(courses.map((course) => `/${course}`))('вход в закрытый раздел %s', (prefix) => {
  it('без сессии закрытый раздел уводит на вход с сообщением', async () => {
    const reply = await client.send(`${prefix}/secure`);
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe(`${prefix}/login`);

    const login = await client.send(`${prefix}/login`, { headers: { cookie: cookieHeader(reply.headers) } });
    expect(login.body).toContain('<div id="flash" class="flash error">You must log in to view the secure area!</div>');
  });

  it('неверный пароль возвращает на вход', async () => {
    const reply = await logIn(prefix, credentials.username, 'wrong');
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe(`${prefix}/login`);

    const login = await client.send(`${prefix}/login`, { headers: { cookie: cookieHeader(reply.headers) } });
    expect(login.body).toContain('Your username or password is invalid!');
  });

  it('верная учётка открывает закрытый раздел, выход закрывает его', async () => {
    const reply = await logIn(prefix, credentials.username, credentials.password);
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe(`${prefix}/secure`);

    const cookie = cookieHeader(reply.headers);
    const secure = await client.send(`${prefix}/secure`, { headers: { cookie } });
    expect(secure.status).toBe(200);
    expect(secure.body).toContain('<h2>Secure Area</h2>');
    expect(secure.body).toContain('<div id="flash" class="flash success">You logged into a secure area!</div>');
    expect(secure.body).toContain(`href="${prefix}/logout"`);
    expect(secure.body).toContain('id="menu-button"');

    const logout = await client.send(`${prefix}/logout`, { headers: { cookie } });
    expect(logout.status).toBe(302);
    expect(logout.headers.location).toBe(`${prefix}/login`);
    expect(String(logout.headers['set-cookie'])).toContain('ui-session=;');
  });

  it('подделанная сессия не открывает закрытый раздел', async () => {
    const reply = await client.send(`${prefix}/secure`, { headers: { cookie: 'ui-session=student' } });
    expect(reply.status).toBe(302);
  });
});

describe('курсы не делят сессию', () => {
  it('вход в одном курсе не открывает закрытый раздел другого', async () => {
    const [first, second] = courses;
    const reply = await logIn(`/${first}`, credentials.username, credentials.password);
    const cookie = cookieHeader(reply.headers);
    expect(String(reply.headers['set-cookie'])).toContain(`Path=/${first}`);
    const secure = await client.send(`/${second}/secure`, { headers: { cookie } });
    expect(secure.status).toBe(302);
  });

  it('ссылки страниц ведут внутрь своего курса', async () => {
    for (const course of courses) {
      const reply = await client.send(`/${course}`);
      expect(reply.body).toContain(`href="/${course}/login"`);
      expect(reply.body).not.toContain('{{prefix}}');
    }
  });
});
