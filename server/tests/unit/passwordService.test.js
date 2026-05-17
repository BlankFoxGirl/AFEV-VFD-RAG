const { hashPassword, verifyPassword } = require('../../src/services/passwordService');

describe('passwordService', () => {
  describe('hashPassword', () => {
    it('returns a hashed string different from the plain password', async () => {
      const plain = 'mySecret123';
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(typeof hash).toBe('string');
    });

    it('generates a unique hash each call for the same password', async () => {
      const plain = 'mySecret123';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);
      expect(hash1).not.toBe(hash2);
    });

    it('produces a bcrypt hash recognisable by its prefix', async () => {
      const hash = await hashPassword('anyPassword1');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('returns true when the plain password matches the hash', async () => {
      const plain = 'correct-password';
      const hash = await hashPassword(plain);
      expect(await verifyPassword(plain, hash)).toBe(true);
    });

    it('returns false when the plain password does not match the hash', async () => {
      const hash = await hashPassword('correct-password');
      expect(await verifyPassword('wrong-password', hash)).toBe(false);
    });
  });
});
