const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = '24h';

function generateToken({ userId, email }) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function decodeToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, decodeToken };
