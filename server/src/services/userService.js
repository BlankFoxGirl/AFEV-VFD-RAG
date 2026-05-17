const User = require('../models/User');
const { hashPassword } = require('./passwordService');

async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase().trim() });
}

async function findUserById(userId) {
  return User.findById(userId);
}

async function createUser({ email, password }) {
  const passwordHash = await hashPassword(password);
  const user = new User({ email: email.toLowerCase().trim(), passwordHash });
  return user.save();
}

async function updateUserProfile(userId, updates) {
  return User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
}

module.exports = { findUserByEmail, findUserById, createUser, updateUserProfile };
