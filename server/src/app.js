const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const profileRoutes = require('./routes/profile');
const { createSessionMiddleware } = require('./middleware/sessionMiddleware');
const { createRequireAuthMiddleware } = require('./middleware/requireAuth');
const { defaultSessionStore } = require('./services/sessionStore');

const app = express();

app.use(cors());
app.use(express.json());

const sessionMiddleware = createSessionMiddleware(defaultSessionStore);
const requireAuth = createRequireAuthMiddleware(defaultSessionStore);

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionMiddleware, sessionRoutes);
app.use('/api/profile', requireAuth, profileRoutes);

module.exports = app;
