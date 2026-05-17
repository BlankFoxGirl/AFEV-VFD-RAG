const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/services/tokenService');
const { defaultSessionStore, generateSessionId } = require('../../src/services/sessionStore');

jest.mock('../../src/services/userService');
jest.mock('../../src/services/passwordService');

const { findUserByEmail, findUserById, createUser } = require('../../src/services/userService');
const { verifyPassword } = require('../../src/services/passwordService');

const TEST_USER_ID = 'guard-test-user-1';
const TEST_EMAIL = 'guardtest@example.com';

const storedUser = {
  _id: TEST_USER_ID,
  email: TEST_EMAIL,
  passwordHash: '$2b$10$hashedpassword',
  name: 'Guard Test User',
};

function createAuthenticatedRequest() {
  const sessionId = generateSessionId();
  defaultSessionStore.save(sessionId, TEST_USER_ID, TEST_EMAIL);
  const token = generateToken({ userId: TEST_USER_ID, email: TEST_EMAIL, sessionId });
  return { token, sessionId };
}

describe('Route Guard — whitelisted routes bypass authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows POST /api/auth/login without an Authorization header', async () => {
    findUserByEmail.mockResolvedValue(storedUser);
    verifyPassword.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'SecurePass1' });

    expect(res.status).toBe(200);
  });

  it('allows POST /api/auth/register without an Authorization header', async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(storedUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: 'SecurePass1' });

    expect(res.status).not.toBe(401);
  });
});

describe('Route Guard — protected routes require authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for GET /api/profile without a token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for GET /api/session/status without a token', async () => {
    const res = await request(app).get('/api/session/status');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for PUT /api/profile with a malformed token', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', 'Bearer not.a.valid.token')
      .send({ name: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Route Guard — session middleware integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access to /api/profile with a valid session token', async () => {
    findUserById.mockResolvedValue(storedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows access to /api/session/status with a valid session token', async () => {
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .get('/api/session/status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 when the server-side session has expired', async () => {
    const sessionId = generateSessionId();
    defaultSessionStore.save(sessionId, TEST_USER_ID, TEST_EMAIL);

    const session = defaultSessionStore.find(sessionId);
    jest.spyOn(Date, 'now').mockReturnValue(session.expiresAt + 1000);

    const token = generateToken({ userId: TEST_USER_ID, email: TEST_EMAIL, sessionId });

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    jest.restoreAllMocks();
  });
});
