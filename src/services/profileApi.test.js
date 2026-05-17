import axios from 'axios';
import * as authToken from './authToken';
import { fetchProfile, updateProfile, updatePassword, updateAvatar } from './profileApi';

jest.mock('axios');
jest.mock('./authToken');

describe('profileApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authToken.getToken.mockReturnValue(null);
    authToken.saveToken.mockImplementation(() => {});
  });

  describe('fetchProfile', () => {
    it('sends a GET request to /api/profile', async () => {
      axios.get.mockResolvedValueOnce({ data: { user: {} }, headers: {} });
      await fetchProfile();
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile'),
        expect.any(Object)
      );
    });

    it('includes the Authorization header when a token is stored', async () => {
      authToken.getToken.mockReturnValue('stored-jwt');
      axios.get.mockResolvedValueOnce({ data: { user: {} }, headers: {} });
      await fetchProfile();
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer stored-jwt' }),
        })
      );
    });

    it('omits the Authorization header when no token is stored', async () => {
      authToken.getToken.mockReturnValue(null);
      axios.get.mockResolvedValueOnce({ data: { user: {} }, headers: {} });
      await fetchProfile();
      const [, config] = axios.get.mock.calls[0];
      expect(config.headers.Authorization).toBeUndefined();
    });

    it('saves the renewed token from the X-Renewed-Token response header', async () => {
      authToken.getToken.mockReturnValue('original-jwt');
      axios.get.mockResolvedValueOnce({
        data: { user: {} },
        headers: { 'x-renewed-token': 'refreshed-jwt' },
      });
      await fetchProfile();
      expect(authToken.saveToken).toHaveBeenCalledWith('refreshed-jwt');
    });

    it('returns the response data', async () => {
      const profileData = { user: { name: 'Jane', email: 'jane@example.com' } };
      axios.get.mockResolvedValueOnce({ data: profileData, headers: {} });
      const result = await fetchProfile();
      expect(result).toEqual(profileData);
    });
  });

  describe('updateProfile', () => {
    it('sends a PUT request with name, email, and phone', async () => {
      axios.put.mockResolvedValueOnce({ data: { user: {} }, headers: {} });
      await updateProfile({ name: 'Jane', email: 'jane@example.com', phone: '+1234567890' });
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile'),
        { name: 'Jane', email: 'jane@example.com', phone: '+1234567890' },
        expect.any(Object)
      );
    });

    it('includes the Authorization header when a token is stored', async () => {
      authToken.getToken.mockReturnValue('my-token');
      axios.put.mockResolvedValueOnce({ data: {}, headers: {} });
      await updateProfile({ name: 'Jane', email: 'jane@example.com', phone: '' });
      const [, , config] = axios.put.mock.calls[0];
      expect(config.headers).toMatchObject({ Authorization: 'Bearer my-token' });
    });
  });

  describe('updatePassword', () => {
    it('sends a PUT request to the password endpoint', async () => {
      axios.put.mockResolvedValueOnce({ data: { success: true }, headers: {} });
      await updatePassword({ currentPassword: 'OldPass1', newPassword: 'NewPass1' });
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/password'),
        { currentPassword: 'OldPass1', newPassword: 'NewPass1' },
        expect.any(Object)
      );
    });
  });

  describe('updateAvatar', () => {
    it('sends a POST request with FormData containing the avatar file', async () => {
      axios.post.mockResolvedValueOnce({ data: { avatarUrl: 'url' }, headers: {} });
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      await updateAvatar(file);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile/avatar'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        })
      );
    });

    it('merges auth headers with multipart content-type for avatar upload', async () => {
      authToken.getToken.mockReturnValue('upload-token');
      axios.post.mockResolvedValueOnce({ data: {}, headers: {} });
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      await updateAvatar(file);
      const [, , config] = axios.post.mock.calls[0];
      expect(config.headers).toMatchObject({
        Authorization: 'Bearer upload-token',
        'Content-Type': 'multipart/form-data',
      });
    });
  });
});
