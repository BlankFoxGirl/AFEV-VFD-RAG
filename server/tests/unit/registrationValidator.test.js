const { validateRegistrationInput, validateEmail, validatePassword } = require('../../src/validators/registrationValidator');

describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns an error when email is missing', () => {
    expect(validateEmail(undefined)).toBeTruthy();
    expect(validateEmail(null)).toBeTruthy();
    expect(validateEmail('')).toBeTruthy();
  });

  it('returns an error for an email without @ symbol', () => {
    expect(validateEmail('notanemail')).toBeTruthy();
  });

  it('returns an error for an email without a domain', () => {
    expect(validateEmail('user@')).toBeTruthy();
  });
});

describe('validatePassword', () => {
  it('returns null for a password meeting minimum length', () => {
    expect(validatePassword('password1')).toBeNull();
  });

  it('returns an error when password is missing', () => {
    expect(validatePassword(undefined)).toBeTruthy();
    expect(validatePassword(null)).toBeTruthy();
    expect(validatePassword('')).toBeTruthy();
  });

  it('returns an error when password is shorter than 8 characters', () => {
    expect(validatePassword('short')).toBeTruthy();
  });
});

describe('validateRegistrationInput', () => {
  it('returns isValid true when email and password are valid', () => {
    const result = validateRegistrationInput({ email: 'user@example.com', password: 'securePass1' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns isValid false and errors when email is invalid', () => {
    const result = validateRegistrationInput({ email: 'bad-email', password: 'securePass1' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeTruthy();
  });

  it('returns isValid false and errors when password is too short', () => {
    const result = validateRegistrationInput({ email: 'user@example.com', password: 'short' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBeTruthy();
  });

  it('returns all field errors when both fields are invalid', () => {
    const result = validateRegistrationInput({ email: '', password: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
  });
});
