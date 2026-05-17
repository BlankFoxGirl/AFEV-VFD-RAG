import axios from 'axios';
import { getToken, saveToken } from './authToken';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function buildAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function storeRenewedToken(response) {
  const renewedToken = response.headers['x-renewed-token'];
  if (renewedToken) saveToken(renewedToken);
}

export async function fetchProfile() {
  const response = await axios.get(`${API_BASE_URL}/api/profile`, {
    headers: buildAuthHeaders(),
  });
  storeRenewedToken(response);
  return response.data;
}

export async function updateProfile({ name, email, phone }) {
  const response = await axios.put(
    `${API_BASE_URL}/api/profile`,
    { name, email, phone },
    { headers: buildAuthHeaders() }
  );
  storeRenewedToken(response);
  return response.data;
}

export async function updatePassword({ currentPassword, newPassword }) {
  const response = await axios.put(
    `${API_BASE_URL}/api/profile/password`,
    { currentPassword, newPassword },
    { headers: buildAuthHeaders() }
  );
  storeRenewedToken(response);
  return response.data;
}

export async function updateAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await axios.post(
    `${API_BASE_URL}/api/profile/avatar`,
    formData,
    { headers: { ...buildAuthHeaders(), 'Content-Type': 'multipart/form-data' } }
  );
  storeRenewedToken(response);
  return response.data;
}
