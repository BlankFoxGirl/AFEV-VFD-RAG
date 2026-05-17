import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function registerUser({ email, password }) {
  const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
    email,
    password,
  });
  return response.data;
}
