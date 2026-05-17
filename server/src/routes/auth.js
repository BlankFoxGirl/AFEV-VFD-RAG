const express = require('express');
const { validateRegistrationInput } = require('../validators/registrationValidator');
const { findUserByEmail, createUser } = require('../services/userService');

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

module.exports = router;
