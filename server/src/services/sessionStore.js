const crypto = require('crypto');

function sessionTimeoutMs() {
  return parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10) * 60 * 1000;
}

function generateSessionId() {
  return crypto.randomUUID();
}

function buildSession(sessionId, userId, email) {
  const now = Date.now();
  return {
    sessionId,
    userId,
    email,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + sessionTimeoutMs(),
  };
}

function createInMemorySessionStore() {
  const sessions = new Map();

  function save(sessionId, userId, email) {
    sessions.set(sessionId, buildSession(sessionId, userId, email));
  }

  function find(sessionId) {
    return sessions.get(sessionId) || null;
  }

  function remove(sessionId) {
    sessions.delete(sessionId);
  }

  function refresh(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    const refreshed = {
      ...session,
      lastActivityAt: Date.now(),
      expiresAt: Date.now() + sessionTimeoutMs(),
    };
    sessions.set(sessionId, refreshed);
    return refreshed;
  }

  function hasExpired(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return true;
    return Date.now() > session.expiresAt;
  }

  return { save, find, remove, refresh, hasExpired };
}

const defaultSessionStore = createInMemorySessionStore();

module.exports = { createInMemorySessionStore, defaultSessionStore, generateSessionId };
