const { decodeToken, generateToken } = require('../services/tokenService');

const RENEWAL_THRESHOLD_RATIO = 0.25;

function sessionTimeoutMs() {
  return parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10) * 60 * 1000;
}

function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function isJwtNearExpiry(jwtExpSeconds) {
  const remainingMs = jwtExpSeconds * 1000 - Date.now();
  return remainingMs < sessionTimeoutMs() * RENEWAL_THRESHOLD_RATIO;
}

function createSessionMiddleware(sessionStore) {
  return function sessionMiddleware(req, res, next) {
    const token = extractBearerToken(req.headers['authorization']);

    if (!token) {
      return res.status(401).json({ success: false, message: 'No session token provided.' });
    }

    let decoded;
    try {
      decoded = decodeToken(token);
    } catch (err) {
      console.warn(`Session token validation failed: ${err.message}`);
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }

    const { sessionId, userId, email } = decoded;

    if (!sessionId) {
      return res.status(401).json({ success: false, message: 'Token missing session identifier.' });
    }

    if (sessionStore.hasExpired(sessionId)) {
      sessionStore.remove(sessionId);
      console.info(`Session expired and removed: sessionId=${sessionId}`);
      return res.status(401).json({ success: false, message: 'Session has expired.' });
    }

    const session = sessionStore.refresh(sessionId);
    console.info(`Session activity recorded: sessionId=${sessionId}, userId=${userId}`);

    req.user = { userId, email };
    req.sessionId = sessionId;
    req.sessionData = session;

    if (isJwtNearExpiry(decoded.exp)) {
      const renewedToken = generateToken({ userId, email, sessionId });
      res.setHeader('X-Renewed-Token', renewedToken);
      console.info(`Session auto-renewed: sessionId=${sessionId}`);
    }

    next();
  };
}

module.exports = { createSessionMiddleware, extractBearerToken };
