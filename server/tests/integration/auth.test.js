const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/services/userService');
const { findUserByEmail, createUser } = require('../../src/services/userService');

const existingUser = {
  _id: 'user-id-1',
  email: 'existing@example.com',
  passwordHash: '$2b$10$hashedpassword',
};

const newUser = {
  _id: 'user-id-2',
  email: 'new@example.com',
  passwordHash: '$2b$10$anotherhash',
};

describe('POST /api/auth/register - integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 with user data on successful registration', async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(newUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'securePass1' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(newUser.email);
    expect(res.body.user.id).toBe(newUser._id);
  });

  it('calls createUser with the submitted email and password', async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(newUser);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'securePass1' });

    expect(createUser).toHaveBeenCalledWith({ email: 'new@example.com', password: 'securePass1' });
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'securePass1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.email).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.password).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('returns 409 when email is already registered', async () => {
    findUserByEmail.mockResolvedValue(existingUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@example.com', password: 'securePass1' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.email).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('does not expose passwordHash in the response', async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(newUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'securePass1' });

    expect(res.body.user.passwordHash).toBeUndefined();
  });
});
