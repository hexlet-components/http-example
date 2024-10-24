import path from 'node:path';
import fastifyStatic from '@fastify/static';
import formbody from '@fastify/formbody';

import appConfig from '../../app.config.json'  with {type: 'json'}

const { dirname } = import.meta;

const setUpStaticAssets = (app) => {
  const pathPublic = path.join(dirname, '../assets');
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setupDocs = (app) => appConfig.apps.forEach((name) => {
  app.get(`/${name}/${appConfig.docRoute}`, (req, res) => res.sendFile(`docs/${name}/index.html`));
});

export default async (app, _options) => {
  await app.register(formbody);
  setUpStaticAssets(app);

  setupDocs(app);

  app.get('/http-protocol/example', (req, res) => {
    res
      .headers({
        Expires: -1,
        'Cache-Control': 'private, max-age=0',
        'Content-Type': 'text/html; charset=ISO-8859-1',
        'P3P': 'CP="This is not a P3P policy! See g.co/p3phelp for more info."',
        Server: 'gws',
        'X-XSS-Protection': 0,
        'X-Frame-Options': 'SAMEORIGIN',
        'Accept-Ranges': 'none',
        Vary: 'Accept-Encoding',
        'Set-Cookie': [
          '1P_JAR=2020-01-18-09; expires=Mon, 17-Feb-2020 09:24:50 GMT; path=/; domain=.hexlet.app; Secure',
          'NID=196=wsHLMAMfnAaSyF7zduokI8TJeE5UoIKPHYC58HYH93VMnev9Nc2bAjhRdzoc4UhmuOd7ZVCorDnzGDe51yPefsRMeVyOFnYdHYYgQNqI8A1dYuk4pDK4OJurQgL4lX8kiNGSNi_kkUESFQ-MqLCB_YspxA9JRejhZdkTRtGyHNk; expires=Sun, 19-Jul-2020 09:24:50 GMT; path=/; domain=.hexlet.app; HttpOnly',
        ],
      })
      .send('Done!');
  });

  app.post('/http-protocol/login', (req, res) => res.send('Done!'));

  app.get('/http-api/example', (req, res) => res.send('Done!'));

  app.get('/http-protocol/stream', async (req, res) => {
    // Установим заголовок для передачи данных в формате текстового потока
    res.type('text/plain');

    // Функция, которая отправляет чанки данных
    const sendChunks = async () => {
      for (let i = 0; i < 5; i++) {
        // Отправляем чанк данных
        res.raw.write(`Chunk ${i + 1}\n`);
        // Имитация задержки между отправками чанков
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      // Завершаем поток
      res.raw.end();
    };

    // Запускаем отправку чанков
    sendChunks().catch(err => {
      req.log.error(err);
      res.send(err);
    });
  });

  app.get('/http-protocol', (req, res) => res.sendFile('http-protocol/index.html'));

  app.get('/http-protocol/removed', (req, res) => res.code(301).redirect('/http-protocol/example'));

  app.get('/js-playwright/users-list', (req, res) => res.sendFile('users-list/index.html'));

  app.get('/js-dom-testing-library/users-list', (req, res) => res.sendFile('users-list/index.html'));

  app.get('/', (req, res) => res.sendFile('main/index.html'));

  app.post('/http-api/echo', (req, res) => res.send(req.body));

  return app;
};
