const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/services/userService');
jest.mock('../../src/services/passwordService');

const { findUserByEmail } = require('../../src/services/userService');
const { verifyPassword } = require('../../src/services/passwordService');

const existingUser = {
  _id: 'user-id-1',
  email: 'user@example.com',
  passwordHash: '$2b$10$hashedpassword',
};

async function loginAndGetToken() {
  findUserByEmail.mockResolvedValue(existingUser);
  verifyPassword.mockResolvedValue(true);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: existingUser.email, password: 'SecurePass1' });

  return res.body.token;
}

describe('GET /api/session/status - integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/session/status');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when the token is malformed', async () => {
    const res = await request(app)
      .get('/api/session/status')
      .set('Authorization', 'Bearer not.a.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with session info for a valid login token', async () => {
    const token = await loginAndGetToken();

    const res = await request(app)
      .get('/api/session/status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session.email).toBe(existingUser.email);
    expect(res.body.session.sessionId).toBeTruthy();
    expect(res.body.session.expiresAt).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/session/renew - integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).post('/api/session/renew');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with a new token on a valid session', async () => {
    const originalToken = await loginAndGetToken();

    const res = await request(app)
      .post('/api/session/renew')
      .set('Authorization', `Bearer ${originalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.token).not.toBe(originalToken);
  });

  it('includes updated session metadata in the renewal response', async () => {
    const originalToken = await loginAndGetToken();

    const res = await request(app)
      .post('/api/session/renew')
      .set('Authorization', `Bearer ${originalToken}`);

    expect(res.body.session.sessionId).toBeTruthy();
    expect(res.body.session.expiresAt).toBeGreaterThan(Date.now());
    expect(res.body.session.lastActivityAt).toBeGreaterThan(0);
  });

  it('renewed token is accepted by subsequent session requests', async () => {
    const originalToken = await loginAndGetToken();

    const renewRes = await request(app)
      .post('/api/session/renew')
      .set('Authorization', `Bearer ${originalToken}`);

    const newToken = renewRes.body.token;

    const statusRes = await request(app)
      .get('/api/session/status')
      .set('Authorization', `Bearer ${newToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
  });
});
