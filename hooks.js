const hooks = require('hooks');

hooks.beforeAll(async (ransactions, done) => {
  const utils = await import('./server/utils.js');
  const state = utils.getInitData();
  for (const transaction of ransactions) {
    if (transaction.request.method !== 'DELETE') {
      transaction.expected.headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    if (transaction.id === 'POST (200) /login') {
      transaction.request.body = JSON.stringify({ email: state.users[0].email, password: state.users[0].password });
    }
    transaction.request.headers['Authorization'] = `Bearer ${state.tokens[0].token}`;
    transaction.request.headers['x-api-key'] = state.appConfig.apiKey;
  }

  done();
});
