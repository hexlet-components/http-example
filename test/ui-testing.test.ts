import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { credentials } from '../custom-server/src/ui-testing.ts';
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

const logIn = (username: string, password: string) =>
  client.send('/ui-testing/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams({ username, password }).toString(),
  });

// Уроки Selenium и Playwright ищут эти элементы и тексты дословно.
describe('страницы для UI-тестов', () => {
  it.each([
    [
      '/ui-testing',
      ['<title>Hexlet UI Testing</title>', '<h1 class="heading">Welcome to UI testing</h1>', 'Form Authentication'],
    ],
    ['/ui-testing/hovers', ['class="figure"', '<h5>name: user1</h5>']],
    ['/ui-testing/drag_and_drop', ['id="column-a"', 'id="column-b"']],
    ['/ui-testing/key_presses', ['id="target"', 'id="result"']],
    ['/ui-testing/javascript_alerts', ['onclick="jsAlert()"', 'onclick="jsConfirm()"', 'onclick="jsPrompt()"']],
    ['/ui-testing/windows', ['target="_blank">Click Here</a>']],
    ['/ui-testing/windows/new', ['<h3>New Window</h3>']],
    ['/ui-testing/iframe', ['name="editor-frame"']],
    ['/ui-testing/iframe/content', ['id="content"']],
    [
      '/ui-testing/login',
      [
        '<h2>Login Page</h2>',
        'form id="login"',
        'id="username"',
        'id="password"',
        'type="submit" data-test="login-button"',
      ],
    ],
  ])('%s', async (url, fragments) => {
    const reply = await client.send(url);
    expect(reply.status).toBe(200);
    for (const fragment of fragments) {
      expect(reply.body).toContain(fragment);
    }
  });

  it('стиль страниц отдаётся статикой', async () => {
    expect((await client.send('/assets/ui-testing/style.css')).status).toBe(200);
  });
});

describe('вход в закрытый раздел', () => {
  it('без сессии закрытый раздел уводит на вход с сообщением', async () => {
    const reply = await client.send('/ui-testing/secure');
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe('/ui-testing/login');

    const login = await client.send('/ui-testing/login', { headers: { cookie: cookieHeader(reply.headers) } });
    expect(login.body).toContain('<div id="flash" class="flash error">You must log in to view the secure area!</div>');
  });

  it('неверный пароль возвращает на вход', async () => {
    const reply = await logIn(credentials.username, 'wrong');
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe('/ui-testing/login');

    const login = await client.send('/ui-testing/login', { headers: { cookie: cookieHeader(reply.headers) } });
    expect(login.body).toContain('Your username or password is invalid!');
  });

  it('верная учётка открывает закрытый раздел, выход закрывает его', async () => {
    const reply = await logIn(credentials.username, credentials.password);
    expect(reply.status).toBe(302);
    expect(reply.headers.location).toBe('/ui-testing/secure');

    const cookie = cookieHeader(reply.headers);
    const secure = await client.send('/ui-testing/secure', { headers: { cookie } });
    expect(secure.status).toBe(200);
    expect(secure.body).toContain('<h2>Secure Area</h2>');
    expect(secure.body).toContain('<div id="flash" class="flash success">You logged into a secure area!</div>');
    expect(secure.body).toContain('href="/ui-testing/logout"');
    expect(secure.body).toContain('id="menu-button"');

    const logout = await client.send('/ui-testing/logout', { headers: { cookie } });
    expect(logout.status).toBe(302);
    expect(logout.headers.location).toBe('/ui-testing/login');
    expect(String(logout.headers['set-cookie'])).toContain('ui-session=;');
  });

  it('подделанная сессия не открывает закрытый раздел', async () => {
    const reply = await client.send('/ui-testing/secure', { headers: { cookie: 'ui-session=student' } });
    expect(reply.status).toBe(302);
  });
});
