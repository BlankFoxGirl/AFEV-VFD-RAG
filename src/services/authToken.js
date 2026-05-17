const TOKEN_STORAGE_KEY = 'auth_token';

export function saveToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
