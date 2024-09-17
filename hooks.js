const hooks = require('hooks');

hooks.beforeAll(async (ransactions, done) => {
  for (const transaction of ransactions) {
    if (transaction.request.method !== 'DELETE') {
      transaction.expected.headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    transaction.request.headers['Authorization'] = 'Bearer some-token';
  }

  done();
});
