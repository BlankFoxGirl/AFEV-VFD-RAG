const { createSessionMiddleware } = require('./sessionMiddleware');

function createRequireAuthMiddleware(sessionStore) {
  return createSessionMiddleware(sessionStore);
}

module.exports = { createRequireAuthMiddleware };
