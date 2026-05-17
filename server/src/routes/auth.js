const express = require('express');
const { validateRegistrationInput } = require('../validators/registrationValidator');
const { validateLoginInput } = require('../validators/loginValidator');
const { findUserByEmail, createUser } = require('../services/userService');
const { verifyPassword } = require('../services/passwordService');
const { generateToken } = require('../services/tokenService');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const { isValid, errors } = validateRegistrationInput({ email, password });
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ success: false, errors: { email: 'Email is already registered' } });
  }

  const user = await createUser({ email, password });

  return res.status(201).json({
    success: true,
    user: { id: user._id, email: user.email },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { isValid, errors } = validateLoginInput({ email, password });
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.warn(`Failed login attempt for unrecognised email`);
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    console.warn(`Failed login attempt for email: ${email}`);
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = generateToken({ userId: user._id, email: user.email });
  console.info(`Successful login for email: ${email}`);

  return res.status(200).json({
    success: true,
    token,
    user: { id: user._id, email: user.email },
  });
});

module.exports = router;
