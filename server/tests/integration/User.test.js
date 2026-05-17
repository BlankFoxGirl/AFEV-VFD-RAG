jest.mock('../../src/models/User');
const User = require('../../src/models/User');
const { findUserByEmail, createUser } = require('../../src/services/userService');

describe('userService integration with User model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    it('queries User model with a normalised email', async () => {
      User.findOne.mockResolvedValue(null);
      await findUserByEmail('USER@EXAMPLE.COM');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
    });

    it('returns the matched user document', async () => {
      const storedUser = { _id: 'id1', email: 'user@example.com' };
      User.findOne.mockResolvedValue(storedUser);
      const result = await findUserByEmail('user@example.com');
      expect(result).toEqual(storedUser);
    });

    it('returns null when no user matches the email', async () => {
      User.findOne.mockResolvedValue(null);
      const result = await findUserByEmail('missing@example.com');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('constructs a User with a normalised email', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      User.mockImplementation((data) => ({ ...data, save: mockSave }));

      await createUser({ email: 'USER@EXAMPLE.COM', password: 'securePass1' });

      const constructorArg = User.mock.calls[0][0];
      expect(constructorArg.email).toBe('user@example.com');
    });

    it('stores a hashed password rather than the plain-text password', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      User.mockImplementation((data) => ({ ...data, save: mockSave }));

      await createUser({ email: 'user@example.com', password: 'securePass1' });

      const constructorArg = User.mock.calls[0][0];
      expect(constructorArg.passwordHash).not.toBe('securePass1');
      expect(constructorArg.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('persists the user document by calling save', async () => {
      const savedUser = { _id: 'id1', email: 'user@example.com', passwordHash: 'hash' };
      const mockSave = jest.fn().mockResolvedValue(savedUser);
      User.mockImplementation(() => ({ save: mockSave }));

      const result = await createUser({ email: 'user@example.com', password: 'securePass1' });

      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedUser);
    });
  });
});
