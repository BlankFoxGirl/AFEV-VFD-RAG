const express = require('express');
const { validateProfileUpdateInput, validatePhone } = require('../validators/profileUpdateValidator');
const { validatePassword } = require('../validators/registrationValidator');
const { findUserById, findUserByEmail, updateUserProfile } = require('../services/userService');
const { verifyPassword, hashPassword } = require('../services/passwordService');

const router = express.Router();

function buildPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || null,
  };
}

router.get('/', async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: buildPublicUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

router.put('/update', async (req, res) => {
  const { name, email, phone } = req.body;
  const { isValid, errors } = validateProfileUpdateInput({ name, email });
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  if (phone !== undefined) {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ success: false, errors: { phone: phoneError } });
    }
  }

  try {
    if (email !== undefined) {
      const existing = await findUserByEmail(email);
      if (existing && existing._id.toString() !== req.user.userId) {
        return res.status(409).json({ success: false, message: 'Email is already in use.' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone;

    const updatedUser = await updateUserProfile(req.user.userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: buildPublicUser(updatedUser) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

router.put('/', async (req, res) => {
  const { name, email, phone } = req.body;
  const { isValid, errors } = validateProfileUpdateInput({ name, email });
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  if (phone !== undefined) {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ success: false, errors: { phone: phoneError } });
    }
  }

  try {
    if (email !== undefined) {
      const existing = await findUserByEmail(email);
      if (existing && existing._id.toString() !== req.user.userId) {
        return res.status(409).json({ success: false, message: 'Email is already in use.' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone;

    const updatedUser = await updateUserProfile(req.user.userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: buildPublicUser(updatedUser) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      errors: { currentPassword: 'Current password is required' },
    });
  }

  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) {
    return res.status(400).json({ success: false, errors: { newPassword: newPasswordError } });
  }

  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const passwordMatches = await verifyPassword(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await updateUserProfile(req.user.userId, { passwordHash: newPasswordHash });

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

router.post('/avatar', async (req, res) => {
  const { profilePicture } = req.body;
  const { isValid, errors } = validateProfileUpdateInput({ profilePicture });
  if (!isValid) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const updatedUser = await updateUserProfile(req.user.userId, { avatarUrl: profilePicture });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, avatarUrl: updatedUser.avatarUrl });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update avatar.' });
  }
});

module.exports = router;
