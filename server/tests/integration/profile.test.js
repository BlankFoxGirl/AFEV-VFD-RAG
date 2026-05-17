const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/services/tokenService');
const { defaultSessionStore, generateSessionId } = require('../../src/services/sessionStore');

jest.mock('../../src/services/userService');
jest.mock('../../src/services/passwordService');

const { findUserById, findUserByEmail, updateUserProfile } = require('../../src/services/userService');
const { verifyPassword, hashPassword } = require('../../src/services/passwordService');

const TEST_USER_ID = 'user-id-1';
const TEST_EMAIL = 'jane@example.com';

const storedUser = {
  _id: TEST_USER_ID,
  email: TEST_EMAIL,
  passwordHash: '$2b$10$hashedpassword',
  name: 'Jane Doe',
  phone: '+1234567890',
  avatarUrl: null,
};

function createAuthenticatedRequest() {
  const sessionId = generateSessionId();
  defaultSessionStore.save(sessionId, TEST_USER_ID, TEST_EMAIL);
  const token = generateToken({ userId: TEST_USER_ID, email: TEST_EMAIL, sessionId });
  return { token, sessionId };
}

describe('GET /api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('returns 200 with user profile data on valid session', async () => {
    findUserById.mockResolvedValue(storedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.name).toBe('Jane Doe');
  });

  it('does not expose passwordHash in the response', async () => {
    findUserById.mockResolvedValue(storedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 404 when user is not found', async () => {
    findUserById.mockResolvedValue(null);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/profile/update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .put('/api/profile/update')
      .send({ name: 'John Smith', email: 'john@example.com' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with updated user data on valid input', async () => {
    const updatedUser = { ...storedUser, name: 'John Smith' };
    findUserByEmail.mockResolvedValue(null);
    updateUserProfile.mockResolvedValue(updatedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Smith', email: 'john@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('John Smith');
  });

  it('does not expose passwordHash in the update response', async () => {
    const updatedUser = { ...storedUser, name: 'John Smith' };
    findUserByEmail.mockResolvedValue(null);
    updateUserProfile.mockResolvedValue(updatedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Smith' });

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 400 when email is invalid format', async () => {
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.email).toBeTruthy();
  });

  it('returns 400 when name is empty', async () => {
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.name).toBeTruthy();
  });

  it('returns 409 when email is already used by another user', async () => {
    const otherUser = { ...storedUser, _id: 'other-user-id' };
    findUserByEmail.mockResolvedValue(otherUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('does not block update when the email belongs to the same user', async () => {
    const updatedUser = { ...storedUser };
    findUserByEmail.mockResolvedValue(storedUser);
    updateUserProfile.mockResolvedValue(updatedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
  });
});

describe('PUT /api/profile (alias)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with updated user data on valid input', async () => {
    const updatedUser = { ...storedUser, name: 'John Smith' };
    findUserByEmail.mockResolvedValue(null);
    updateUserProfile.mockResolvedValue(updatedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Smith', email: 'john@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('John Smith');
  });
});

describe('PUT /api/profile/password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .send({ currentPassword: 'OldPass1', newPassword: 'NewPass1!' });
    expect(res.status).toBe(401);
  });

  it('returns 200 on successful password change', async () => {
    findUserById.mockResolvedValue(storedUser);
    verifyPassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue('$2b$10$newhashedpassword');
    updateUserProfile.mockResolvedValue({ ...storedUser, passwordHash: '$2b$10$newhashedpassword' });
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when currentPassword is missing', async () => {
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'NewPass1!' });

    expect(res.status).toBe(400);
    expect(res.body.errors.currentPassword).toBeTruthy();
  });

  it('returns 400 when newPassword is too short', async () => {
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass1!', newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errors.newPassword).toBeTruthy();
  });

  it('returns 401 when current password does not match', async () => {
    findUserById.mockResolvedValue(storedUser);
    verifyPassword.mockResolvedValue(false);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass1!', newPassword: 'NewPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('does not expose sensitive data in the password change response', async () => {
    findUserById.mockResolvedValue(storedUser);
    verifyPassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue('$2b$10$newhashedpassword');
    updateUserProfile.mockResolvedValue({ ...storedUser, passwordHash: '$2b$10$newhashedpassword' });
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' });

    expect(res.body.passwordHash).toBeUndefined();
  });
});

describe('POST /api/profile/avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .send({ profilePicture: 'https://example.com/img.jpg' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with avatarUrl on valid URL', async () => {
    const updatedUser = { ...storedUser, avatarUrl: 'https://example.com/avatar.jpg' };
    updateUserProfile.mockResolvedValue(updatedUser);
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ profilePicture: 'https://example.com/avatar.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.avatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('returns 400 when profilePicture is not a valid URL or base64', async () => {
    const { token } = createAuthenticatedRequest();

    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ profilePicture: 'invalid-picture' });

    expect(res.status).toBe(400);
    expect(res.body.errors.profilePicture).toBeTruthy();
  });
});
