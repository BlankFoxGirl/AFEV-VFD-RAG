const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const { createSessionMiddleware } = require('./middleware/sessionMiddleware');
const { defaultSessionStore } = require('./services/sessionStore');

const app = express();

app.use(cors());
app.use(express.json());

const sessionMiddleware = createSessionMiddleware(defaultSessionStore);

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionMiddleware, sessionRoutes);

module.exports = app;
