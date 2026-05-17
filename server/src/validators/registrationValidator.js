const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  return null;
}

function validateRegistrationInput({ email, password }) {
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateRegistrationInput, validateEmail, validatePassword };
