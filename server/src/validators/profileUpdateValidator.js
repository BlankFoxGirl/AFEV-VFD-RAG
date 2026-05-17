const { validateEmail, validatePassword } = require('./registrationValidator');

const VALID_URL_REGEX = /^https?:\/\/.+/;
const VALID_BASE64_IMAGE_REGEX = /^data:image\/(jpeg|png|gif|webp);base64,/;

function validateName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'Name must be a non-empty string';
  }
  return null;
}

function validatePhone(phone) {
  if (typeof phone !== 'string') return 'Phone must be a string';
  const phonePattern = /^[+\d\s\-().]{7,20}$/;
  if (phone.trim().length > 0 && !phonePattern.test(phone.trim())) {
    return 'Enter a valid phone number';
  }
  return null;
}

function validateProfilePicture(profilePicture) {
  if (typeof profilePicture !== 'string') {
    return 'Profile picture must be a valid URL or Base64 image string';
  }
  const isUrl = VALID_URL_REGEX.test(profilePicture);
  const isBase64 = VALID_BASE64_IMAGE_REGEX.test(profilePicture);
  if (!isUrl && !isBase64) {
    return 'Profile picture must be a valid URL or Base64 image string';
  }
  return null;
}

function validateProfileUpdateInput({ name, email, password, profilePicture }) {
  const errors = {};

  if (name !== undefined) {
    const nameError = validateName(name);
    if (nameError) errors.name = nameError;
  }

  if (email !== undefined) {
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
  }

  if (password !== undefined) {
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
  }

  if (profilePicture !== undefined) {
    const pictureError = validateProfilePicture(profilePicture);
    if (pictureError) errors.profilePicture = pictureError;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateProfileUpdateInput, validateName, validatePhone, validateProfilePicture };
