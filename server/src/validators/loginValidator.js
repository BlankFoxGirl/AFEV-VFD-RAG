const { validateEmail, validatePassword } = require('./registrationValidator');

function validateLoginInput({ email, password }) {
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateLoginInput };
