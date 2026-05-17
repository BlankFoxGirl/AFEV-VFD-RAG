const { createInMemorySessionStore, generateSessionId } = require('../../src/services/sessionStore');

describe('sessionStore', () => {
  describe('generateSessionId', () => {
    it('returns a non-empty string', () => {
      const id = generateSessionId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates unique IDs on each call', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('createInMemorySessionStore', () => {
    let store;
    const sessionId = 'test-session-id';
    const userId = 'user-id-1';
    const email = 'user@example.com';

    beforeEach(() => {
      store = createInMemorySessionStore();
    });

    describe('save', () => {
      it('stores a session retrievable by sessionId', () => {
        store.save(sessionId, userId, email);
        const session = store.find(sessionId);
        expect(session).not.toBeNull();
        expect(session.sessionId).toBe(sessionId);
        expect(session.userId).toBe(userId);
        expect(session.email).toBe(email);
      });

      it('records createdAt and lastActivityAt as recent timestamps', () => {
        const before = Date.now();
        store.save(sessionId, userId, email);
        const after = Date.now();
        const session = store.find(sessionId);
        expect(session.createdAt).toBeGreaterThanOrEqual(before);
        expect(session.createdAt).toBeLessThanOrEqual(after);
        expect(session.lastActivityAt).toBeGreaterThanOrEqual(before);
      });

      it('sets expiresAt in the future', () => {
        store.save(sessionId, userId, email);
        const session = store.find(sessionId);
        expect(session.expiresAt).toBeGreaterThan(Date.now());
      });
    });

    describe('find', () => {
      it('returns null for an unknown sessionId', () => {
        expect(store.find('nonexistent')).toBeNull();
      });
    });

    describe('remove', () => {
      it('deletes the session so find returns null', () => {
        store.save(sessionId, userId, email);
        store.remove(sessionId);
        expect(store.find(sessionId)).toBeNull();
      });

      it('does not throw when removing a nonexistent session', () => {
        expect(() => store.remove('nonexistent')).not.toThrow();
      });
    });

    describe('hasExpired', () => {
      it('returns false for a freshly created session', () => {
        store.save(sessionId, userId, email);
        expect(store.hasExpired(sessionId)).toBe(false);
      });

      it('returns true for an unknown sessionId', () => {
        expect(store.hasExpired('nonexistent')).toBe(true);
      });

      it('returns true when the session expiresAt is in the past', () => {
        store.save(sessionId, userId, email);
        const session = store.find(sessionId);
        jest.spyOn(Date, 'now').mockReturnValue(session.expiresAt + 1);
        expect(store.hasExpired(sessionId)).toBe(true);
        jest.restoreAllMocks();
      });
    });

    describe('refresh', () => {
      it('returns null for an unknown sessionId', () => {
        expect(store.refresh('nonexistent')).toBeNull();
      });

      it('updates lastActivityAt and expiresAt', () => {
        store.save(sessionId, userId, email);
        const original = store.find(sessionId);

        jest.spyOn(Date, 'now').mockReturnValue(original.createdAt + 5000);
        const refreshed = store.refresh(sessionId);

        expect(refreshed.lastActivityAt).toBeGreaterThan(original.lastActivityAt);
        expect(refreshed.expiresAt).toBeGreaterThan(original.expiresAt);
        jest.restoreAllMocks();
      });

      it('preserves createdAt after refresh', () => {
        store.save(sessionId, userId, email);
        const original = store.find(sessionId);
        const refreshed = store.refresh(sessionId);
        expect(refreshed.createdAt).toBe(original.createdAt);
      });
    });
  });
});
