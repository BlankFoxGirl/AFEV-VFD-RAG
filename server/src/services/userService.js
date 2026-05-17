const User = require('../models/User');
const { hashPassword } = require('./passwordService');

async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase().trim() });
}

async function createUser({ email, password }) {
  const passwordHash = await hashPassword(password);
  const user = new User({ email: email.toLowerCase().trim(), passwordHash });
  return user.save();
}

module.exports = { findUserByEmail, createUser };
