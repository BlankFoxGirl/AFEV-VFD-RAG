import axios from 'axios';
import { saveToken } from './authToken';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function loginUser({ email, password }) {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email,
    password,
  });
  const { token } = response.data;
  if (token) saveToken(token);
  return response.data;
}
