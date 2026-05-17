const { createSessionMiddleware, extractBearerToken } = require('../../src/middleware/sessionMiddleware');
const { generateToken, decodeToken } = require('../../src/services/tokenService');
const { createInMemorySessionStore } = require('../../src/services/sessionStore');

describe('extractBearerToken', () => {
  it('returns null when authorization header is absent', () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('returns null when header does not start with Bearer', () => {
    expect(extractBearerToken('Basic sometoken')).toBeNull();
  });

  it('extracts the token from a valid Bearer header', () => {
    expect(extractBearerToken('Bearer mytoken123')).toBe('mytoken123');
  });
});

describe('createSessionMiddleware', () => {
  let store;
  let middleware;
  let res;
  const userId = 'user-id-1';
  const email = 'user@example.com';

  function buildReqWithToken(token) {
    return { headers: { authorization: `Bearer ${token}` } };
  }

  function buildRes() {
    const r = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
    return r;
  }

  beforeEach(() => {
    store = createInMemorySessionStore();
    middleware = createSessionMiddleware(store);
    res = buildRes();
  });

  it('returns 401 when no Authorization header is present', () => {
    const req = { headers: {} };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token is invalid', () => {
    const req = buildReqWithToken('not.a.valid.jwt');
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token has no sessionId', () => {
    const tokenWithoutSession = generateToken({ userId, email });
    const req = buildReqWithToken(tokenWithoutSession);
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/session identifier/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the session does not exist in the store', () => {
    const sessionId = 'nonexistent-session';
    const token = generateToken({ userId, email, sessionId });
    const req = buildReqWithToken(token);
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/expired/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the server-side session has expired due to inactivity', () => {
    const sessionId = 'expiring-session';
    store.save(sessionId, userId, email);

    const session = store.find(sessionId);
    jest.spyOn(Date, 'now').mockReturnValue(session.expiresAt + 1000);

    const token = generateToken({ userId, email, sessionId });
    const req = buildReqWithToken(token);
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('calls next() for a valid token with an active session', () => {
    const sessionId = 'active-session';
    store.save(sessionId, userId, email);
    const token = generateToken({ userId, email, sessionId });
    const req = buildReqWithToken(token);
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('attaches user info to req.user for a valid session', () => {
    const sessionId = 'active-session';
    store.save(sessionId, userId, email);
    const token = generateToken({ userId, email, sessionId });
    const req = buildReqWithToken(token);
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.user).toEqual({ userId, email });
    expect(req.sessionId).toBe(sessionId);
    expect(req.sessionData).toBeTruthy();
  });

  it('sets X-Renewed-Token header when the JWT is near expiry', () => {
    const sessionId = 'near-expiry-session';
    store.save(sessionId, userId, email);

    const token = generateToken({ userId, email, sessionId });
    const { exp } = decodeToken(token);

    // Advance time to 60 seconds before JWT expiry (within the 25% renewal threshold)
    const nearExpiryNow = exp * 1000 - 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(nearExpiryNow);

    const req = buildReqWithToken(token);
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Renewed-Token', expect.any(String));
    jest.restoreAllMocks();
  });

  it('does not set X-Renewed-Token header when session has plenty of time remaining', () => {
    const sessionId = 'fresh-session';
    store.save(sessionId, userId, email);
    const token = generateToken({ userId, email, sessionId });
    const req = buildReqWithToken(token);
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalledWith('X-Renewed-Token', expect.any(String));
  });
});
