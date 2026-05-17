import { saveToken, getToken, clearToken } from './authToken';

describe('authToken', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves a token to localStorage', () => {
    saveToken('test-token-abc');
    expect(localStorage.getItem('auth_token')).toBe('test-token-abc');
  });

  it('retrieves the stored token', () => {
    saveToken('my-jwt-token');
    expect(getToken()).toBe('my-jwt-token');
  });

  it('returns null when no token has been saved', () => {
    expect(getToken()).toBeNull();
  });

  it('clears the stored token', () => {
    saveToken('some-token');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('overwrites the previous token when a new one is saved', () => {
    saveToken('first-token');
    saveToken('second-token');
    expect(getToken()).toBe('second-token');
  });
});
