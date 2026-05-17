const { createRouteGuard, WHITELISTED_ROUTES, isWhitelistedRoute } = require('../../src/middleware/routeGuard');
const { generateToken } = require('../../src/services/tokenService');
const { createInMemorySessionStore } = require('../../src/services/sessionStore');

describe('WHITELISTED_ROUTES', () => {
  it('includes the login route', () => {
    expect(WHITELISTED_ROUTES).toContain('/api/auth/login');
  });

  it('includes the register route', () => {
    expect(WHITELISTED_ROUTES).toContain('/api/auth/register');
  });
});

describe('isWhitelistedRoute', () => {
  it('returns true for the login route', () => {
    expect(isWhitelistedRoute('/api/auth/login')).toBe(true);
  });

  it('returns true for the register route', () => {
    expect(isWhitelistedRoute('/api/auth/register')).toBe(true);
  });

  it('returns false for the profile route', () => {
    expect(isWhitelistedRoute('/api/profile')).toBe(false);
  });

  it('returns false for the session status route', () => {
    expect(isWhitelistedRoute('/api/session/status')).toBe(false);
  });

  it('returns false for an unknown route', () => {
    expect(isWhitelistedRoute('/api/unknown')).toBe(false);
  });
});

describe('createRouteGuard', () => {
  let store;
  let routeGuard;
  let res;

  const userId = 'user-1';
  const email = 'user@example.com';

  function buildReq({ path = '/api/profile', method = 'GET', token = null } = {}) {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    return { headers, path, method };
  }

  function buildRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
  }

  beforeEach(() => {
    store = createInMemorySessionStore();
    routeGuard = createRouteGuard(store);
    res = buildRes();
  });

  describe('whitelisted routes', () => {
    it('calls next() for the login route without authentication', () => {
      const req = buildReq({ path: '/api/auth/login', method: 'POST' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next() for the register route without authentication', () => {
      const req = buildReq({ path: '/api/auth/register', method: 'POST' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('protected routes without authentication', () => {
    it('returns 401 when accessing /api/profile without a token', () => {
      const req = buildReq({ path: '/api/profile' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when accessing /api/session/status without a token', () => {
      const req = buildReq({ path: '/api/session/status' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when the bearer token is invalid', () => {
      const req = buildReq({ path: '/api/profile', token: 'invalid.token.value' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('protected routes with valid authentication', () => {
    it('calls next() for a valid token with an active session', () => {
      const sessionId = 'active-session';
      store.save(sessionId, userId, email);
      const token = generateToken({ userId, email, sessionId });
      const req = buildReq({ path: '/api/profile', token });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('attaches user info to req.user on successful authentication', () => {
      const sessionId = 'active-session';
      store.save(sessionId, userId, email);
      const token = generateToken({ userId, email, sessionId });
      const req = buildReq({ path: '/api/profile', token });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(req.user).toEqual({ userId, email });
      expect(req.sessionId).toBe(sessionId);
    });
  });

  describe('unauthorized access logging', () => {
    it('logs a warning when a protected route is accessed without a token', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const req = buildReq({ path: '/api/profile', method: 'GET' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Unauthorized access attempt/)
      );
      warnSpy.mockRestore();
    });

    it('includes the request method in the unauthorized access log', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const req = buildReq({ path: '/api/profile', method: 'PUT' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('method=PUT'));
      warnSpy.mockRestore();
    });

    it('includes the request path in the unauthorized access log', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const req = buildReq({ path: '/api/profile', method: 'GET' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('path=/api/profile'));
      warnSpy.mockRestore();
    });

    it('does not log an unauthorized attempt for whitelisted routes', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const req = buildReq({ path: '/api/auth/login', method: 'POST' });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/Unauthorized access attempt/)
      );
      warnSpy.mockRestore();
    });

    it('does not log an unauthorized attempt for valid authenticated requests', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const sessionId = 'active-session';
      store.save(sessionId, userId, email);
      const token = generateToken({ userId, email, sessionId });
      const req = buildReq({ path: '/api/profile', token });
      const next = jest.fn();

      routeGuard(req, res, next);

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/Unauthorized access attempt/)
      );
      warnSpy.mockRestore();
    });
  });
});
