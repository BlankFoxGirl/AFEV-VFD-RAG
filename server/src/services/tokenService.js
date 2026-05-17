const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function sessionTimeoutSeconds() {
  return parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10) * 60;
}

function generateToken({ userId, email, sessionId }) {
  const jti = crypto.randomUUID();
  const payload = sessionId
    ? { userId, email, sessionId, jti }
    : { userId, email, jti };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: sessionTimeoutSeconds() });
}

function decodeToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, decodeToken };
