import type { FastifyInstance } from 'fastify';

const OFFICE_HOURS = 'Office hours: 09:00-18:00';
const VERSION = '"office-v1"';

export default async function setUpSessionCacheExamples(app: FastifyInstance) {
  app.get('/http-for-automation/login-form', (_request, reply) =>
    reply.sendFile('http-for-automation/login-form.html'),
  );
  app.get('/http-for-automation/session', (request, reply) => {
    const text = request.cookies.session === 'hexlet-demo' ? 'Welcome, student!' : 'Guest';
    return reply.type('text/plain; charset=utf-8').header('Cache-Control', 'no-store').send(text);
  });
  app.post<{ Body: { username?: string } }>('/http-for-automation/session', (request, reply) => {
    if (request.body?.username !== 'student') {
      return reply.code(400).type('text/plain; charset=utf-8').send('Use the demo username student');
    }
    return reply
      .setCookie('session', 'hexlet-demo', {
        path: '/http-for-automation',
        maxAge: 300,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      })
      .type('text/plain; charset=utf-8')
      .header('Cache-Control', 'no-store')
      .send('Session started');
  });
  app.delete('/http-for-automation/session', (_request, reply) =>
    reply
      .clearCookie('session', {
        path: '/http-for-automation',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      })
      .type('text/plain; charset=utf-8')
      .header('Cache-Control', 'no-store')
      .send('Session ended'),
  );

  for (const [url, policy] of [
    ['/http-for-automation/cache', 'private, max-age=60'],
    ['/http-for-automation/cache/revalidate', 'no-cache'],
    ['/http-for-automation/cache/no-store', 'no-store'],
  ]) {
    app.get(url, (request, reply) => {
      reply.header('Cache-Control', policy);
      if (policy !== 'no-store') {
        reply.header('ETag', VERSION);
        const matches = request.headers['if-none-match']?.split(',').map((tag) => tag.trim().replace(/^W\//, ''));
        if (matches?.includes(VERSION) || matches?.includes('*')) return reply.code(304).send();
      }
      return reply.type('text/plain; charset=utf-8').send(OFFICE_HOURS);
    });
  }
}
