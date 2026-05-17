const { createRequireAuthMiddleware } = require('../../src/middleware/requireAuth');
const { generateToken } = require('../../src/services/tokenService');
const { createInMemorySessionStore } = require('../../src/services/sessionStore');

describe('createRequireAuthMiddleware', () => {
  let store;
  let requireAuth;
  let res;

  const userId = 'user-1';
  const email = 'user@example.com';

  function buildReqWithToken(token) {
    return { headers: { authorization: `Bearer ${token}` } };
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
    requireAuth = createRequireAuthMiddleware(store);
    res = buildRes();
  });

  describe('unauthenticated sessions', () => {
    it('returns 401 when no Authorization header is present', () => {
      const req = { headers: {} };
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when the bearer token is invalid', () => {
      const req = buildReqWithToken('invalid.token.value');
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when the session does not exist in the store', () => {
      const token = generateToken({ userId, email, sessionId: 'missing-session' });
      const req = buildReqWithToken(token);
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when the server-side session has expired', () => {
      const sessionId = 'expiring-session';
      store.save(sessionId, userId, email);

      const session = store.find(sessionId);
      jest.spyOn(Date, 'now').mockReturnValue(session.expiresAt + 1000);

      const token = generateToken({ userId, email, sessionId });
      const req = buildReqWithToken(token);
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });

  describe('authenticated sessions', () => {
    it('calls next() for a valid token with an active session', () => {
      const sessionId = 'active-session';
      store.save(sessionId, userId, email);
      const token = generateToken({ userId, email, sessionId });
      const req = buildReqWithToken(token);
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('attaches user info to req.user for a valid session', () => {
      const sessionId = 'active-session';
      store.save(sessionId, userId, email);
      const token = generateToken({ userId, email, sessionId });
      const req = buildReqWithToken(token);
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(req.user).toEqual({ userId, email });
      expect(req.sessionId).toBe(sessionId);
    });
  });
});
