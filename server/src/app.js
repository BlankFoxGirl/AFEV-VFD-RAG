const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const profileRoutes = require('./routes/profile');
const { createRouteGuard } = require('./middleware/routeGuard');
const { defaultSessionStore } = require('./services/sessionStore');

const app = express();

app.use(cors());
app.use(express.json());

const routeGuard = createRouteGuard(defaultSessionStore);

app.use(routeGuard);

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/profile', profileRoutes);

module.exports = app;
