const express = require('express');
const { generateToken } = require('../services/tokenService');
const { defaultSessionStore } = require('../services/sessionStore');

const router = express.Router();

router.get('/status', (req, res) => {
  const { userId, email } = req.user;
  const { sessionId, sessionData } = req;

  console.info(`Session status checked: sessionId=${sessionId}, userId=${userId}`);

  return res.status(200).json({
    success: true,
    session: {
      userId,
      email,
      sessionId,
      expiresAt: sessionData.expiresAt,
      lastActivityAt: sessionData.lastActivityAt,
    },
  });
});

router.post('/renew', (req, res) => {
  const { userId, email } = req.user;
  const { sessionId } = req;

  const session = defaultSessionStore.refresh(sessionId);
  const token = generateToken({ userId, email, sessionId });

  console.info(`Session manually renewed: sessionId=${sessionId}, userId=${userId}`);

  return res.status(200).json({
    success: true,
    token,
    session: {
      userId,
      email,
      sessionId,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    },
  });
});

module.exports = router;
