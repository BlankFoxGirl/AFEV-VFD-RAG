const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/services/userService');
jest.mock('../../src/services/passwordService');
const { findUserByEmail, createUser } = require('../../src/services/userService');
const { verifyPassword } = require('../../src/services/passwordService');

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

describe('POST /api/auth/login - integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with token and user on valid credentials', async () => {
    findUserByEmail.mockResolvedValue(existingUser);
    verifyPassword.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: existingUser.email, password: 'correctPassword1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(existingUser.email);
    expect(res.body.user.id).toBe(existingUser._id);
  });

  it('does not expose passwordHash in the response', async () => {
    findUserByEmail.mockResolvedValue(existingUser);
    verifyPassword.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: existingUser.email, password: 'correctPassword1' });

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 when user is not found', async () => {
    findUserByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'correctPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 401 when password does not match', async () => {
    findUserByEmail.mockResolvedValue(existingUser);
    verifyPassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: existingUser.email, password: 'wrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'correctPassword1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.email).toBeTruthy();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: existingUser.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.password).toBeTruthy();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('calls findUserByEmail with the submitted email', async () => {
    findUserByEmail.mockResolvedValue(existingUser);
    verifyPassword.mockResolvedValue(true);

    await request(app)
      .post('/api/auth/login')
      .send({ email: existingUser.email, password: 'correctPassword1' });

    expect(findUserByEmail).toHaveBeenCalledWith(existingUser.email);
  });
});

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
