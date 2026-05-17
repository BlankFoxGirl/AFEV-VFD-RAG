const {
  validateProfileUpdateInput,
  validateName,
  validatePhone,
  validateProfilePicture,
} = require('../../src/validators/profileUpdateValidator');

describe('validateName', () => {
  it('returns null for a valid non-empty name', () => {
    expect(validateName('Jane Doe')).toBeNull();
  });

  it('returns an error when name is an empty string', () => {
    expect(validateName('')).toBeTruthy();
  });

  it('returns an error when name is whitespace only', () => {
    expect(validateName('   ')).toBeTruthy();
  });

  it('returns an error when name is not a string', () => {
    expect(validateName(42)).toBeTruthy();
    expect(validateName(null)).toBeTruthy();
  });
});

describe('validatePhone', () => {
  it('returns null for a valid phone number', () => {
    expect(validatePhone('+1234567890')).toBeNull();
  });

  it('returns null for an empty string (phone is optional)', () => {
    expect(validatePhone('')).toBeNull();
  });

  it('returns an error when phone contains invalid characters', () => {
    expect(validatePhone('abc')).toBeTruthy();
  });

  it('returns an error when phone is not a string', () => {
    expect(validatePhone(123)).toBeTruthy();
  });
});

describe('validateProfilePicture', () => {
  it('returns null for a valid http URL', () => {
    expect(validateProfilePicture('http://example.com/avatar.png')).toBeNull();
  });

  it('returns null for a valid https URL', () => {
    expect(validateProfilePicture('https://cdn.example.com/img.jpg')).toBeNull();
  });

  it('returns null for a valid base64 jpeg string', () => {
    expect(validateProfilePicture('data:image/jpeg;base64,/9j/4AAQ')).toBeNull();
  });

  it('returns null for a valid base64 png string', () => {
    expect(validateProfilePicture('data:image/png;base64,iVBORw')).toBeNull();
  });

  it('returns an error for a plain string that is not a URL or base64', () => {
    expect(validateProfilePicture('not-a-valid-url')).toBeTruthy();
  });

  it('returns an error when value is not a string', () => {
    expect(validateProfilePicture(42)).toBeTruthy();
  });
});

describe('validateProfileUpdateInput', () => {
  it('returns isValid true when all provided fields are valid', () => {
    const result = validateProfileUpdateInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns isValid true when no fields are provided (all optional)', () => {
    const result = validateProfileUpdateInput({});
    expect(result.isValid).toBe(true);
  });

  it('returns an error when name is empty', () => {
    const result = validateProfileUpdateInput({ name: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeTruthy();
  });

  it('returns an error when email is invalid format', () => {
    const result = validateProfileUpdateInput({ email: 'not-an-email' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeTruthy();
  });

  it('returns an error when password is too short', () => {
    const result = validateProfileUpdateInput({ password: 'short' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBeTruthy();
  });

  it('returns isValid true when password meets minimum length', () => {
    const result = validateProfileUpdateInput({ password: 'ValidPass1' });
    expect(result.isValid).toBe(true);
  });

  it('returns an error when profilePicture is not a URL or base64', () => {
    const result = validateProfileUpdateInput({ profilePicture: 'not-valid' });
    expect(result.isValid).toBe(false);
    expect(result.errors.profilePicture).toBeTruthy();
  });

  it('collects errors for multiple invalid fields', () => {
    const result = validateProfileUpdateInput({ name: '', email: 'bad' });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.email).toBeTruthy();
  });
});
