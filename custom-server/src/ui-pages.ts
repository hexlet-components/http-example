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

// Учётка помимо основной: вторая роль со своим разделом или заблокированный
// пользователь, на котором уроки показывают сообщение об ошибке входа.
interface Account {
  username: string;
  password: string;
  home: string;
  locked?: boolean;
}

interface UiApp {
  title: string;
  credentials: { username: string; password: string };
  extraAccounts?: Account[];
  securePath: string;
  texts: {
    loginHeading: string;
    secureHeading: string;
    loggedIn: string;
    invalid: string;
    mustLogIn: string;
    loggedOut: string;
    // Без этих текстов пустое поле считается неверной учёткой, как раньше.
    usernameRequired?: string;
    passwordRequired?: string;
    locked?: string;
  };
  secureBody: string;
  // Выхода в меню нет: ссылка на /logout на странице одна, и find_element по
  // href не находит скрытый пункт меню раньше видимой кнопки.
  menu: { label: string; path: string }[];
  // Шапка приложения над содержимым каждой страницы, кроме фреймов.
  header?: string;
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
    extraAccounts: [
      { username: 'agent', password: 'staff123', home: '/staff' }, // betterleaks:allow учебная учётка, напечатана в уроках
      { username: 'blocked', password: 'flight123', home: '/trips', locked: true }, // betterleaks:allow учебная учётка, напечатана в уроках
    ],
    securePath: '/trips',
    texts: {
      loginHeading: 'Passenger login',
      secureHeading: 'My trips',
      loggedIn: 'Welcome aboard!',
      invalid: 'Wrong username or password.',
      mustLogIn: 'Log in to see your trips.',
      loggedOut: 'You logged out.',
      usernameRequired: 'Username is required.',
      passwordRequired: 'Password is required.',
      locked: 'This account is locked.',
    },
    // Токен в localStorage нужен уроку про storage_state: снимок состояния
    // уносит и куки, и localStorage. Выход по бездействию через пять минут
    // показывает page.clock: без перемотки времени тест ждал бы по-настоящему.
    secureBody: `<ul id="trips">
        <li class="trip">SK 204 to Lisbon, seat 14A</li>
      </ul>
      <h3>Flight updates</h3>
      <ul aria-label="Flight updates">
        <li>Check-in is open</li>
        <li>Gate changed to B12</li>
        <li>Boarding starts at 08:00</li>
      </ul>
      <script>
        localStorage.setItem('auth_token', 'passenger-token');
        let idle;
        const restart = () => {
          clearTimeout(idle);
          idle = setTimeout(() => location.assign('{{prefix}}/session-expired'), 5 * 60 * 1000);
        };
        for (const event of ['mousemove', 'keydown', 'click']) document.addEventListener(event, restart);
        restart();
      </script>`,
    menu: [{ label: 'Departures', path: '' }],
    header: `<header>
      <img src="/assets/ui-pages/python-playwright/logo.svg" alt="Departures logo" width="32" height="32" />
      <button id="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">Navigation</button>
      <nav aria-label="Main">
        <ul id="nav-links">
          <li><a href="{{prefix}}">Flight board</a></li>
          <li><a href="{{prefix}}/packing">Packing list</a></li>
          <li><a href="{{prefix}}/check-in">Check-in</a></li>
          <li><a href="{{prefix}}/extras">Extras</a></li>
          <li><a href="{{prefix}}/trips">My trips</a></li>
        </ul>
      </nav>
    </header>
    <script>
      // На узком экране ссылки прячутся за кнопкой, на широком кнопки не видно.
      document.getElementById('nav-toggle').addEventListener('click', (event) => {
        const expanded = event.target.getAttribute('aria-expanded') === 'true';
        event.target.setAttribute('aria-expanded', String(!expanded));
        document.getElementById('nav-links').classList.toggle('open', !expanded);
      });
    </script>`,
    pages: {
      '': { file: 'index.html' },
      '/packing': { file: 'packing.html' },
      '/check-in': { file: 'check-in.html' },
      '/boarding-pass': { file: 'boarding-pass.html' },
      '/airport-map': { file: 'airport-map.html' },
      '/payment': { file: 'payment.html', bare: true },
      '/extras': { file: 'extras.html' },
    },
  },
};

const sessionCookie = 'ui-session';
const flashCookie = 'ui-flash';
export const cookieOptionsFor = (prefix: string) => ({ path: prefix, httpOnly: true, sameSite: 'lax' }) as const;

const assetsDir = path.join(import.meta.dirname, '../assets/ui-pages');

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const withPrefix = (text: string, prefix: string) => text.replaceAll('{{prefix}}', prefix);

export const layout = (app: UiApp, prefix: string, body: string) =>
  withPrefix(
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${app.title}</title>
    <link rel="stylesheet" href="/assets/ui-pages/style.css" />
  </head>
  <body>
    <a class="brand" href="${prefix}">${app.title}</a>
${app.header ? `    ${app.header}\n` : ''}${body}
  </body>
</html>
`,
    prefix,
  );

const flashBlock = (flash: { kind: string; message: string } | undefined) =>
  flash ? `    <div id="flash" class="flash ${flash.kind}">${escape(flash.message)}</div>\n` : '';

const takeFlash = (req: FastifyRequest, res: FastifyReply, prefix: string) => {
  const raw = req.cookies[flashCookie];
  if (!raw) return undefined;
  res.clearCookie(flashCookie, cookieOptionsFor(prefix));
  const [kind, message] = raw.split(':', 2) as ['success' | 'error', string];
  return { kind, message };
};

export const redirectWithFlash = (
  res: FastifyReply,
  prefix: string,
  url: string,
  kind: 'success' | 'error',
  message: string,
) => res.setCookie(flashCookie, `${kind}:${message}`, cookieOptionsFor(prefix)).redirect(`${prefix}${url}`);

const accountsOf = (app: UiApp): Account[] => [
  { ...app.credentials, home: app.securePath },
  ...(app.extraAccounts ?? []),
];

// В значении сессии стоит курс: урок про куки подкладывает их руками, и кука
// одного курса не должна открывать закрытый раздел другого.
const sessionValue = (username: string, prefix: string) => `${username}@${prefix}`;

export const startSession = (res: FastifyReply, username: string, prefix: string) =>
  res.setCookie(sessionCookie, sessionValue(username, prefix), { ...cookieOptionsFor(prefix), signed: true });

export const endSession = (res: FastifyReply, prefix: string) =>
  res.clearCookie(sessionCookie, cookieOptionsFor(prefix));

// Учётка, под которой открыта сессия, или undefined без сессии.
export const currentAccount = (req: FastifyRequest, app: UiApp, prefix: string) => {
  const raw = req.cookies[sessionCookie];
  if (!raw) return undefined;
  const { valid, value } = req.unsignCookie(raw);
  if (!valid) return undefined;
  return accountsOf(app).find((account) => !account.locked && sessionValue(account.username, prefix) === value);
};

// Учётка по имени и паролю, как их проверяет форма входа.
export const findAccount = (app: UiApp, username: string, password: string) =>
  accountsOf(app).find((account) => account.username === username && account.password === password);

export const html = (res: FastifyReply, body: string) => res.type('text/html; charset=utf-8').send(body);

const setUpApp = (server: FastifyInstance, course: string, app: UiApp) => {
  const prefix = `/${course}`;
  const { credentials, texts } = app;

  for (const [route, page] of Object.entries(app.pages)) {
    const fragment = withPrefix(readFileSync(path.join(assetsDir, course, page.file), 'utf8'), prefix);
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
        <input type="text" name="username" id="username" placeholder="Username" />
        <label for="password">Password</label>
        <input type="password" name="password" id="password" placeholder="Password" />
        <button class="primary" type="submit" data-test="login-button">Log in</button>
      </form>
    </main>`,
      ),
    );
  });

  server.post(`${prefix}/authenticate`, (req, res) => {
    const { username = '', password = '' } = (req.body ?? {}) as Record<string, string>;
    const fail = (message: string) => redirectWithFlash(res, prefix, '/login', 'error', message);
    if (!username && texts.usernameRequired) return fail(texts.usernameRequired);
    if (!password && texts.passwordRequired) return fail(texts.passwordRequired);
    const account = findAccount(app, username, password);
    if (!account) return fail(texts.invalid);
    if (account.locked) return fail(texts.locked ?? texts.invalid);
    startSession(res, account.username, prefix);
    return redirectWithFlash(res, prefix, account.home, 'success', texts.loggedIn);
  });

  server.get(`${prefix}${app.securePath}`, (req, res) => {
    if (!currentAccount(req, app, prefix)) {
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
    endSession(res, prefix);
    return redirectWithFlash(res, prefix, '/login', 'success', texts.loggedOut);
  });
};

export default async function setUpUiPages(server: FastifyInstance) {
  for (const [course, app] of Object.entries(apps)) {
    setUpApp(server, course, app);
  }
}
