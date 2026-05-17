const { validateProfileUpdateInput, validatePhone } = require('../validators/profileUpdateValidator');

function validateProfileUpdateMiddleware(req, res, next) {
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

  next();
}

module.exports = { validateProfileUpdateMiddleware };
