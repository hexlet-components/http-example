import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Учебные страницы для курсов Selenium и Playwright. Уроки цитируют локаторы и
// тексты этих страниц дословно, так же как уроки HTTP цитируют ответы API.
// Префикс это курс, как у остальных приложений сервера: страницы одни, а
// ссылки и путь куки сессии у каждого курса свои. Вход и закрытый раздел
// собираются здесь, потому что им нужны сессия и флеш-сообщение. Остальные
// страницы лежат шаблонами в assets/ui-pages, префикс в них стоит как {{prefix}}.

export const credentials = { username: 'student', password: 'secret123' };

export const courses = ['java-selenium', 'python-selenium', 'python-playwright'];

const sessionCookie = 'ui-session';
const flashCookie = 'ui-flash';
const cookieOptionsFor = (prefix: string) => ({ path: prefix, httpOnly: true, sameSite: 'lax' }) as const;

const staticPages = {
  '': 'index.html',
  '/hovers': 'hovers.html',
  '/drag_and_drop': 'drag_and_drop.html',
  '/key_presses': 'key_presses.html',
  '/javascript_alerts': 'javascript_alerts.html',
  '/windows': 'windows.html',
  '/windows/new': 'windows_new.html',
  '/iframe': 'iframe.html',
  '/iframe/content': 'iframe_content.html',
};

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const assetsDir = path.join(import.meta.dirname, '../assets/ui-pages');
const templates = Object.fromEntries(
  Object.values(staticPages).map((file) => [file, readFileSync(path.join(assetsDir, file), 'utf8')]),
);

const layout = (prefix: string, body: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hexlet UI Testing</title>
    <link rel="stylesheet" href="/assets/ui-pages/style.css" />
  </head>
  <body>
    <a href="${prefix}">UI testing examples</a>
${body}
    <footer>Powered by <a href="https://hexlet.io">Hexlet</a></footer>
  </body>
</html>
`;

const flashBlock = (flash: string | undefined, kind: 'success' | 'error') =>
  flash ? `    <div id="flash" class="flash ${kind}">${escape(flash)}</div>\n` : '';

const takeFlash = (req: FastifyRequest, res: FastifyReply, prefix: string) => {
  const raw = req.cookies[flashCookie];
  if (!raw) return undefined;
  res.clearCookie(flashCookie, cookieOptionsFor(prefix));
  const [kind, message] = raw.split(':', 2) as ['success' | 'error', string];
  return { kind, message };
};

const redirectWithFlash = (
  res: FastifyReply,
  prefix: string,
  url: string,
  kind: 'success' | 'error',
  message: string,
) => res.setCookie(flashCookie, `${kind}:${message}`, cookieOptionsFor(prefix)).redirect(`${prefix}${url}`);

// В значении сессии стоит курс: урок про куки подкладывает их руками, и кука
// одного курса не должна открывать закрытый раздел другого.
const sessionValue = (prefix: string) => `${credentials.username}@${prefix}`;

const isLoggedIn = (req: FastifyRequest, prefix: string) => {
  const raw = req.cookies[sessionCookie];
  if (!raw) return false;
  const { valid, value } = req.unsignCookie(raw);
  return valid && value === sessionValue(prefix);
};

const setUpCourse = (app: FastifyInstance, course: string) => {
  const prefix = `/${course}`;
  const cookieOptions = cookieOptionsFor(prefix);

  for (const [route, file] of Object.entries(staticPages)) {
    const html = templates[file].replaceAll('{{prefix}}', prefix);
    app.get(`${prefix}${route}`, (_req, res) => res.type('text/html; charset=utf-8').send(html));
  }

  app.get(`${prefix}/login`, (req, res) => {
    const flash = takeFlash(req, res, prefix);
    return res.type('text/html; charset=utf-8').send(
      layout(
        prefix,
        `${flashBlock(flash?.message, flash?.kind ?? 'error')}    <div class="example">
      <h2>Login Page</h2>
      <p>Use <code>${credentials.username}</code> and <code>${credentials.password}</code> to log in.</p>
      <form id="login" action="${prefix}/authenticate" method="post">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" />
        <label for="password">Password</label>
        <input type="password" name="password" id="password" />
        <button class="radius" type="submit" data-test="login-button">Login</button>
      </form>
    </div>`,
      ),
    );
  });

  app.post(`${prefix}/authenticate`, (req, res) => {
    const { username, password } = (req.body ?? {}) as Record<string, string>;
    if (username !== credentials.username || password !== credentials.password) {
      return redirectWithFlash(res, prefix, '/login', 'error', 'Your username or password is invalid!');
    }
    res.setCookie(sessionCookie, sessionValue(prefix), { ...cookieOptions, signed: true });
    return redirectWithFlash(res, prefix, '/secure', 'success', 'You logged into a secure area!');
  });

  app.get(`${prefix}/secure`, (req, res) => {
    if (!isLoggedIn(req, prefix)) {
      return redirectWithFlash(res, prefix, '/login', 'error', 'You must log in to view the secure area!');
    }
    const flash = takeFlash(req, res, prefix);
    return res.type('text/html; charset=utf-8').send(
      layout(
        prefix,
        `${flashBlock(flash?.message, flash?.kind ?? 'success')}    <div class="example">
      <button id="menu-button" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
      <nav id="menu" hidden>
        <a class="menu-item" href="${prefix}">Home</a>
        <a class="menu-item" href="${prefix}/logout">Logout</a>
      </nav>
      <h2>Secure Area</h2>
      <p>Welcome to the secure area. Log out when you are done.</p>
      <a class="button" href="${prefix}/logout">Logout</a>
    </div>
    <script>
      const button = document.getElementById('menu-button');
      const menu = document.getElementById('menu');
      button.addEventListener('click', () => {
        menu.hidden = !menu.hidden;
        button.setAttribute('aria-expanded', String(!menu.hidden));
      });
    </script>`,
      ),
    );
  });

  app.get(`${prefix}/logout`, (_req, res) => {
    res.clearCookie(sessionCookie, cookieOptions);
    return redirectWithFlash(res, prefix, '/login', 'success', 'You logged out of the secure area!');
  });
};

export default async function setUpUiPages(app: FastifyInstance) {
  for (const course of courses) {
    setUpCourse(app, course);
  }
}
