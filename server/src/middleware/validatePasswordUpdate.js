const { validatePasswordStrength } = require('../validators/registrationValidator');

function validatePasswordUpdateMiddleware(req, res, next) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      errors: { currentPassword: 'Current password is required' },
    });
  }

  const newPasswordError = validatePasswordStrength(newPassword);
  if (newPasswordError) {
    return res.status(400).json({ success: false, errors: { newPassword: newPasswordError } });
  }

  next();
}

module.exports = { validatePasswordUpdateMiddleware };
