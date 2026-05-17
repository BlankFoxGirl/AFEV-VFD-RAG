const request = require('supertest');
const app = require('../../src/app');
const { verifyPassword } = require('../../src/services/passwordService');

jest.mock('../../src/services/userService');
const { findUserByEmail, createUser } = require('../../src/services/userService');

describe('End-to-end registration flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and the response contains verifiable credentials', async () => {
    const payload = { email: 'e2e@example.com', password: 'e2ePassword1' };

    findUserByEmail.mockResolvedValue(null);
    createUser.mockImplementation(async ({ email, password }) => {
      const { hashPassword } = require('../../src/services/passwordService');
      const passwordHash = await hashPassword(password);
      return { _id: 'generated-id', email, passwordHash };
    });

    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(payload.email);

    const { hashPassword } = require('../../src/services/passwordService');
    const hash = await hashPassword(payload.password);
    const passwordMatches = await verifyPassword(payload.password, hash);
    expect(passwordMatches).toBe(true);
  });

  it('rejects a duplicate registration without creating a second record', async () => {
    const payload = { email: 'duplicate@example.com', password: 'safePassword1' };

    findUserByEmail.mockResolvedValue({ _id: 'existing-id', email: payload.email });

    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('rejects invalid input without invoking user creation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad-email', password: 'x' });

    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
});
