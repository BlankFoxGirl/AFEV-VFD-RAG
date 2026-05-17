const { createSessionMiddleware, extractBearerToken } = require('./sessionMiddleware');

const WHITELISTED_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
];

function isWhitelistedRoute(path) {
  return WHITELISTED_ROUTES.some((route) => path.startsWith(route));
}

function logUnauthorizedAttempt(req) {
  console.warn(`Unauthorized access attempt: method=${req.method}, path=${req.path}`);
}

function createRouteGuard(sessionStore) {
  const sessionMiddleware = createSessionMiddleware(sessionStore);

  return function routeGuard(req, res, next) {
    if (isWhitelistedRoute(req.path)) {
      return next();
    }

    const token = extractBearerToken(req.headers['authorization']);
    if (!token) {
      logUnauthorizedAttempt(req);
    }

    return sessionMiddleware(req, res, next);
  };
}

module.exports = { createRouteGuard, WHITELISTED_ROUTES, isWhitelistedRoute };
