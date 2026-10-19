import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Учебные приложения для курсов Selenium и Playwright. Префикс это курс, как у
// остальных приложений сервера, и у каждого курса своя предметная область:
// страницы появляются из её сценариев, а не из списка элементов для тренировки.
// Уроки цитируют локаторы и тексты этих страниц дословно, так же как уроки HTTP
// цитируют ответы API.
//
// Общее у приложений только устройство: вёрстка, вход, сессия и флеш-сообщение
// собираются здесь. Страницы лежат фрагментами в assets/ui-pages/<курс>/,
// префикс курса в них записан как {{prefix}}.

interface Page {
  file: string;
  // Страница без общей вёрстки, например содержимое фрейма.
  bare?: boolean;
}

interface UiApp {
  title: string;
  credentials: { username: string; password: string };
  securePath: string;
  texts: {
    loginHeading: string;
    secureHeading: string;
    loggedIn: string;
    invalid: string;
    mustLogIn: string;
    loggedOut: string;
  };
  secureBody: string;
  // Выхода в меню нет: ссылка на /logout на странице одна, и find_element по
  // href не находит скрытый пункт меню раньше видимой кнопки.
  menu: { label: string; path: string }[];
  pages: Record<string, Page>;
}

export const apps: Record<string, UiApp> = {
  'java-selenium': {
    title: 'City Library',
    credentials: { username: 'reader', password: 'books123' },
    securePath: '/my-shelf',
    texts: {
      loginHeading: 'Reader login',
      secureHeading: 'My shelf',
      loggedIn: 'Welcome back! Your shelf is ready.',
      invalid: 'Wrong username or password.',
      mustLogIn: 'Log in to see your shelf.',
      loggedOut: 'You logged out of the library.',
    },
    secureBody: `<ul id="loans">
        <li>Moby Dick, due in 7 days</li>
        <li>Treasure Island, due in 12 days</li>
      </ul>`,
    menu: [
      { label: 'Catalog', path: '' },
      { label: 'Book covers', path: '/covers' },
    ],
    pages: {
      '': { file: 'index.html' },
      '/covers': { file: 'covers.html' },
      '/shelves': { file: 'shelves.html' },
      '/search': { file: 'search.html' },
      '/return': { file: 'return.html' },
      '/preview': { file: 'preview.html' },
      '/preview/moby-dick': { file: 'preview_moby_dick.html' },
      '/reader': { file: 'reader.html' },
      '/reader/chapter': { file: 'reader_chapter.html', bare: true },
    },
  },
  'python-selenium': {
    title: 'Task Board',
    credentials: { username: 'student', password: 'tasks123' },
    securePath: '/tasks',
    texts: {
      loginHeading: 'Sign in',
      secureHeading: 'My tasks',
      loggedIn: 'You are signed in.',
      invalid: 'Invalid username or password.',
      mustLogIn: 'Sign in to see your tasks.',
      loggedOut: 'You are signed out.',
    },
    secureBody: `<ul id="tasks">
        <li class="task">Write the first test</li>
        <li class="task">Add an explicit wait</li>
        <li class="task">Move locators to a page object</li>
      </ul>`,
    menu: [
      { label: 'Inbox', path: '/tasks' },
      { label: 'Today', path: '/tasks' },
    ],
    pages: {
      '': { file: 'index.html' },
    },
  },
  'python-playwright': {
    title: 'Departures',
    credentials: { username: 'passenger', password: 'flight123' },
    securePath: '/trips',
    texts: {
      loginHeading: 'Passenger login',
      secureHeading: 'My trips',
      loggedIn: 'Welcome aboard!',
      invalid: 'Wrong username or password.',
      mustLogIn: 'Log in to see your trips.',
      loggedOut: 'You logged out.',
    },
    secureBody: `<ul id="trips">
        <li class="trip">SK 204 to Lisbon, seat 14A</li>
      </ul>`,
    menu: [{ label: 'Departures', path: '' }],
    pages: {
      '': { file: 'index.html' },
    },
  },
};

const sessionCookie = 'ui-session';
const flashCookie = 'ui-flash';
const cookieOptionsFor = (prefix: string) => ({ path: prefix, httpOnly: true, sameSite: 'lax' }) as const;

const assetsDir = path.join(import.meta.dirname, '../assets/ui-pages');

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const layout = (app: UiApp, prefix: string, body: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${app.title}</title>
    <link rel="stylesheet" href="/assets/ui-pages/style.css" />
  </head>
  <body>
    <a class="brand" href="${prefix}">${app.title}</a>
${body}
  </body>
</html>
`;

const flashBlock = (flash: { kind: string; message: string } | undefined) =>
  flash ? `    <div id="flash" class="flash ${flash.kind}">${escape(flash.message)}</div>\n` : '';

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
const sessionValue = (app: UiApp, prefix: string) => `${app.credentials.username}@${prefix}`;

const isLoggedIn = (req: FastifyRequest, app: UiApp, prefix: string) => {
  const raw = req.cookies[sessionCookie];
  if (!raw) return false;
  const { valid, value } = req.unsignCookie(raw);
  return valid && value === sessionValue(app, prefix);
};

const html = (res: FastifyReply, body: string) => res.type('text/html; charset=utf-8').send(body);

const setUpApp = (server: FastifyInstance, course: string, app: UiApp) => {
  const prefix = `/${course}`;
  const cookieOptions = cookieOptionsFor(prefix);
  const { credentials, texts } = app;

  for (const [route, page] of Object.entries(app.pages)) {
    const fragment = readFileSync(path.join(assetsDir, course, page.file), 'utf8').replaceAll('{{prefix}}', prefix);
    const body = page.bare ? fragment : layout(app, prefix, fragment);
    server.get(`${prefix}${route}`, (_req, res) => html(res, body));
  }

  server.get(`${prefix}/login`, (req, res) => {
    const flash = takeFlash(req, res, prefix);
    return html(
      res,
      layout(
        app,
        prefix,
        `${flashBlock(flash)}    <main class="example">
      <h2>${texts.loginHeading}</h2>
      <p>Use <code>${credentials.username}</code> and <code>${credentials.password}</code> to log in.</p>
      <form id="login" action="${prefix}/authenticate" method="post">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" />
        <label for="password">Password</label>
        <input type="password" name="password" id="password" />
        <button class="primary" type="submit" data-test="login-button">Log in</button>
      </form>
    </main>`,
      ),
    );
  });

  server.post(`${prefix}/authenticate`, (req, res) => {
    const { username, password } = (req.body ?? {}) as Record<string, string>;
    if (username !== credentials.username || password !== credentials.password) {
      return redirectWithFlash(res, prefix, '/login', 'error', texts.invalid);
    }
    res.setCookie(sessionCookie, sessionValue(app, prefix), { ...cookieOptions, signed: true });
    return redirectWithFlash(res, prefix, app.securePath, 'success', texts.loggedIn);
  });

  server.get(`${prefix}${app.securePath}`, (req, res) => {
    if (!isLoggedIn(req, app, prefix)) {
      return redirectWithFlash(res, prefix, '/login', 'error', texts.mustLogIn);
    }
    const flash = takeFlash(req, res, prefix);
    const menu = app.menu
      .map((item) => `        <a class="menu-item" href="${prefix}${item.path}">${item.label}</a>`)
      .join('\n');
    return html(
      res,
      layout(
        app,
        prefix,
        `${flashBlock(flash)}    <main class="example">
      <button id="menu-button" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
      <nav id="menu" hidden>
${menu}
      </nav>
      <h2>${texts.secureHeading}</h2>
      ${app.secureBody}
      <a class="button" href="${prefix}/logout">Logout</a>
    </main>
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

  server.get(`${prefix}/logout`, (_req, res) => {
    res.clearCookie(sessionCookie, cookieOptions);
    return redirectWithFlash(res, prefix, '/login', 'success', texts.loggedOut);
  });
};

export default async function setUpUiPages(server: FastifyInstance) {
  for (const [course, app] of Object.entries(apps)) {
    setUpApp(server, course, app);
  }
}
