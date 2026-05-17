const { generateToken, decodeToken } = require('../../src/services/tokenService');

describe('tokenService', () => {
  const validPayload = { userId: 'user-id-1', email: 'user@example.com' };

  describe('generateToken', () => {
    it('returns a string token', () => {
      const token = generateToken(validPayload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('encodes userId and email into the token', () => {
      const token = generateToken(validPayload);
      const decoded = decodeToken(token);
      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('generates different tokens for different payloads', () => {
      const token1 = generateToken({ userId: 'id-1', email: 'a@example.com' });
      const token2 = generateToken({ userId: 'id-2', email: 'b@example.com' });
      expect(token1).not.toBe(token2);
    });

    it('produces a JWT with three dot-separated parts', () => {
      const token = generateToken(validPayload);
      expect(token.split('.')).toHaveLength(3);
    });
  });
});
