const request = require('supertest');
const app = require('../../src/app');
const { hashPassword } = require('../../src/services/passwordService');

jest.mock('../../src/services/userService');
const { findUserByEmail } = require('../../src/services/userService');

const LOGIN_ENDPOINT = '/api/auth/login';
const SESSION_STATUS_ENDPOINT = '/api/session/status';
const SESSION_RENEW_ENDPOINT = '/api/session/renew';

const VALID_EMAIL = 'login-e2e@example.com';
const VALID_PASSWORD = 'SecurePass1';

async function buildUserWithHashedPassword(email, plainPassword) {
  const passwordHash = await hashPassword(plainPassword);
  return { _id: 'user-id-e2e', email, passwordHash };
}

function bearerHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function loginWithValidCredentials(user) {
  findUserByEmail.mockResolvedValue(user);
  const res = await request(app)
    .post(LOGIN_ENDPOINT)
    .send({ email: VALID_EMAIL, password: VALID_PASSWORD });
  return res;
}

describe('End-to-end login flow', () => {
  let storedUser;

  beforeAll(async () => {
    storedUser = await buildUserWithHashedPassword(VALID_EMAIL, VALID_PASSWORD);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with token and user payload on valid credentials', async () => {
    const res = await loginWithValidCredentials(storedUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(VALID_EMAIL);
    expect(res.body.user.id).toBe(storedUser._id);
  });

  it('does not expose the password hash in the login response', async () => {
    const res = await loginWithValidCredentials(storedUser);

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('token from login grants access to session status endpoint', async () => {
    const loginRes = await loginWithValidCredentials(storedUser);
    const token = loginRes.body.token;

    const statusRes = await request(app)
      .get(SESSION_STATUS_ENDPOINT)
      .set(bearerHeader(token));

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.session.email).toBe(VALID_EMAIL);
    expect(statusRes.body.session.sessionId).toBeTruthy();
    expect(statusRes.body.session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('session created on login contains expected metadata', async () => {
    const loginRes = await loginWithValidCredentials(storedUser);
    const token = loginRes.body.token;

    const statusRes = await request(app)
      .get(SESSION_STATUS_ENDPOINT)
      .set(bearerHeader(token));

    const session = statusRes.body.session;
    expect(session.userId).toBe(storedUser._id);
    expect(session.lastActivityAt).toBeGreaterThan(0);
  });

  it('token from login allows session renewal', async () => {
    const loginRes = await loginWithValidCredentials(storedUser);
    const originalToken = loginRes.body.token;

    const renewRes = await request(app)
      .post(SESSION_RENEW_ENDPOINT)
      .set(bearerHeader(originalToken));

    expect(renewRes.status).toBe(200);
    expect(renewRes.body.success).toBe(true);
    expect(renewRes.body.token).toBeTruthy();
    expect(renewRes.body.token).not.toBe(originalToken);
  });

  it('renewed token is accepted by session status endpoint', async () => {
    const loginRes = await loginWithValidCredentials(storedUser);
    const originalToken = loginRes.body.token;

    const renewRes = await request(app)
      .post(SESSION_RENEW_ENDPOINT)
      .set(bearerHeader(originalToken));

    const renewedToken = renewRes.body.token;

    const statusRes = await request(app)
      .get(SESSION_STATUS_ENDPOINT)
      .set(bearerHeader(renewedToken));

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.session.email).toBe(VALID_EMAIL);
  });

  it('returns 401 with a generic message when the user does not exist', async () => {
    findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({ email: 'nonexistent@example.com', password: VALID_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 with a generic message when the password is wrong', async () => {
    findUserByEmail.mockResolvedValue(storedUser);

    const res = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({ email: VALID_EMAIL, password: 'WrongPassword9' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('does not disclose whether the email exists on a failed login', async () => {
    findUserByEmail.mockResolvedValue(null);
    const notFoundRes = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({ email: 'ghost@example.com', password: VALID_PASSWORD });

    findUserByEmail.mockResolvedValue(storedUser);
    const wrongPasswordRes = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({ email: VALID_EMAIL, password: 'WrongPassword9' });

    expect(notFoundRes.body.message).toBe(wrongPasswordRes.body.message);
  });

  it('returns 400 when email is omitted', async () => {
    const res = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({ password: VALID_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.email).toBeTruthy();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when password is omitted', async () => {
    const res = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({ email: VALID_EMAIL });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.password).toBeTruthy();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
});
