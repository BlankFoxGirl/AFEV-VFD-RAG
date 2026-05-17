import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function fetchProfile() {
  const response = await axios.get(`${API_BASE_URL}/api/profile`);
  return response.data;
}

export async function updateProfile({ name, email, phone }) {
  const response = await axios.put(`${API_BASE_URL}/api/profile`, {
    name,
    email,
    phone,
  });
  return response.data;
}

export async function updatePassword({ currentPassword, newPassword }) {
  const response = await axios.put(`${API_BASE_URL}/api/profile/password`, {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function updateAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await axios.post(`${API_BASE_URL}/api/profile/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
