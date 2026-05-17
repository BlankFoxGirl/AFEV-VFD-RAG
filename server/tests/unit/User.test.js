const User = require('../../src/models/User');

describe('User schema validation', () => {
  describe('required fields', () => {
    it('fails validation when email is missing', () => {
      const user = new User({ passwordHash: 'hashedValue' });
      const error = user.validateSync();
      expect(error.errors.email).toBeDefined();
    });

    it('fails validation when passwordHash is missing', () => {
      const user = new User({ email: 'user@example.com' });
      const error = user.validateSync();
      expect(error.errors.passwordHash).toBeDefined();
    });

    it('passes validation when all required fields are present', () => {
      const user = new User({ email: 'user@example.com', passwordHash: 'hashedValue' });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('email field', () => {
    it('lowercases the email value', () => {
      const user = new User({ email: 'USER@EXAMPLE.COM', passwordHash: 'hash' });
      expect(user.email).toBe('user@example.com');
    });

    it('trims whitespace from the email value', () => {
      const user = new User({ email: '  user@example.com  ', passwordHash: 'hash' });
      expect(user.email).toBe('user@example.com');
    });
  });

  describe('timestamps', () => {
    it('includes createdAt in the schema paths', () => {
      expect(Object.keys(User.schema.paths)).toContain('createdAt');
    });

    it('includes updatedAt in the schema paths', () => {
      expect(Object.keys(User.schema.paths)).toContain('updatedAt');
    });
  });

  describe('schema structure', () => {
    it('defines the email field as a String type', () => {
      expect(User.schema.path('email').instance).toBe('String');
    });

    it('defines the passwordHash field as a String type', () => {
      expect(User.schema.path('passwordHash').instance).toBe('String');
    });

    it('marks email as required', () => {
      expect(User.schema.path('email').isRequired).toBe(true);
    });

    it('marks passwordHash as required', () => {
      expect(User.schema.path('passwordHash').isRequired).toBe(true);
    });
  });
});
