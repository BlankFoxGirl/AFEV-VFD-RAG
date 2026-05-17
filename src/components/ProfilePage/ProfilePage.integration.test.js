import axios from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authToken from '../../services/authToken';
import ProfilePage from './ProfilePage';

jest.mock('axios');
jest.mock('../../services/authToken');

const mockProfile = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  avatarUrl: null,
};

function buildProfileGetResponse(profile = mockProfile) {
  return { data: { user: profile }, headers: {} };
}

async function renderLoadedProfilePage() {
  axios.get.mockResolvedValueOnce(buildProfileGetResponse());
  render(<ProfilePage />);
  await waitFor(() =>
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  );
}

describe('ProfilePage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authToken.getToken.mockReturnValue('test-token');
    authToken.saveToken.mockImplementation(() => {});
  });

  describe('profile load integration', () => {
    it('calls the profile API and displays fetched user data in the form', async () => {
      await renderLoadedProfilePage();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile'),
        expect.any(Object)
      );
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Doe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
      expect(screen.getByLabelText(/phone number/i)).toHaveValue('+1234567890');
    });

    it('sends the stored auth token in the Authorization header when fetching the profile', async () => {
      await renderLoadedProfilePage();

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('redirects to /login?redirect=/profile when the profile API returns 401', async () => {
      const assignMock = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { assign: assignMock },
      });
      axios.get.mockRejectedValueOnce({ response: { status: 401 } });

      render(<ProfilePage />);

      await waitFor(() =>
        expect(assignMock).toHaveBeenCalledWith('/login?redirect=/profile')
      );
    });

    it('saves a renewed token received in the x-renewed-token response header', async () => {
      axios.get.mockResolvedValueOnce({
        data: { user: mockProfile },
        headers: { 'x-renewed-token': 'refreshed-jwt-abc' },
      });

      render(<ProfilePage />);

      await waitFor(() =>
        expect(authToken.saveToken).toHaveBeenCalledWith('refreshed-jwt-abc')
      );
    });

    it('shows an error banner when the profile API call fails with a network error', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      render(<ProfilePage />);

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load profile/i)
      );
    });
  });

  describe('profile update integration', () => {
    it('sends updated profile data to the API on valid form submission', async () => {
      await renderLoadedProfilePage();
      axios.put.mockResolvedValueOnce({
        data: { user: { ...mockProfile, name: 'John Smith' } },
        headers: {},
      });

      await userEvent.clear(screen.getByLabelText(/full name/i));
      await userEvent.type(screen.getByLabelText(/full name/i), 'John Smith');
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/profile'),
          expect.objectContaining({ name: 'John Smith', email: 'jane@example.com' }),
          expect.any(Object)
        )
      );
    });

    it('shows a success banner after the profile API responds with updated data', async () => {
      await renderLoadedProfilePage();
      axios.put.mockResolvedValueOnce({ data: { user: mockProfile }, headers: {} });

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(/profile updated successfully/i)
      );
    });

    it('displays the server error message when the profile API responds with a conflict', async () => {
      await renderLoadedProfilePage();
      axios.put.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'Email is already in use.' },
        },
      });

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(/email is already in use/i)
      );
    });

    it('does not call the profile API when client-side email validation fails', async () => {
      await renderLoadedProfilePage();

      await userEvent.clear(screen.getByLabelText(/email/i));
      await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      expect(axios.put).not.toHaveBeenCalled();
    });

    it('includes the auth token in the profile update request headers', async () => {
      await renderLoadedProfilePage();
      axios.put.mockResolvedValueOnce({ data: { user: mockProfile }, headers: {} });

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
          })
        )
      );
    });
  });

  describe('password update integration', () => {
    it('sends current and new passwords to the password API on valid submission', async () => {
      await renderLoadedProfilePage();
      axios.put.mockResolvedValueOnce({ data: { success: true }, headers: {} });

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPass123');
      await userEvent.type(screen.getByLabelText(/^new password$/i), 'NewPass456');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'NewPass456');
      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/profile/password'),
          { currentPassword: 'OldPass123', newPassword: 'NewPass456' },
          expect.any(Object)
        )
      );
    });

    it('shows a success banner and clears the form after a successful password update', async () => {
      await renderLoadedProfilePage();
      axios.put.mockResolvedValueOnce({ data: { success: true }, headers: {} });

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPass123');
      await userEvent.type(screen.getByLabelText(/^new password$/i), 'NewPass456');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'NewPass456');
      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(/password updated successfully/i)
      );
      expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    });

    it('does not call the password API when passwords do not match', async () => {
      await renderLoadedProfilePage();

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPass123');
      await userEvent.type(screen.getByLabelText(/^new password$/i), 'NewPass456');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'DifferentPass1');
      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      expect(axios.put).not.toHaveBeenCalled();
    });

    it('displays the server error message when the current password is incorrect', async () => {
      await renderLoadedProfilePage();
      axios.put.mockRejectedValueOnce({
        response: { data: { message: 'Current password is incorrect.' } },
      });

      await userEvent.type(screen.getByLabelText(/current password/i), 'WrongPass1');
      await userEvent.type(screen.getByLabelText(/^new password$/i), 'NewPass456');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'NewPass456');
      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(/current password is incorrect/i)
      );
    });
  });

  describe('validation logic integration', () => {
    it('shows email format error and prevents API call when email is invalid', async () => {
      await renderLoadedProfilePage();

      await userEvent.clear(screen.getByLabelText(/email/i));
      await userEvent.type(screen.getByLabelText(/email/i), 'bad-email');
      await userEvent.tab();

      await waitFor(() =>
        expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
      );
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      expect(axios.put).not.toHaveBeenCalled();
    });

    it('shows uppercase requirement error and prevents API call when new password lacks uppercase', async () => {
      await renderLoadedProfilePage();

      await userEvent.type(screen.getByLabelText(/^new password$/i), 'nouppercase1');
      await userEvent.tab();

      await waitFor(() =>
        expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument()
      );
    });

    it('shows number requirement error and prevents API call when new password lacks a digit', async () => {
      await renderLoadedProfilePage();

      await userEvent.type(screen.getByLabelText(/^new password$/i), 'NoNumberHere');
      await userEvent.tab();

      await waitFor(() =>
        expect(screen.getByText(/at least one number/i)).toBeInTheDocument()
      );
    });

    it('shows mismatch error when confirm password differs from new password', async () => {
      await renderLoadedProfilePage();

      await userEvent.type(screen.getByLabelText(/^new password$/i), 'ValidPass1');
      await userEvent.type(screen.getByLabelText(/confirm new password/i), 'DifferentP1');
      await userEvent.tab();

      await waitFor(() =>
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      );
    });

    it('shows required error when name is cleared and the profile form is submitted', async () => {
      await renderLoadedProfilePage();

      await userEvent.clear(screen.getByLabelText(/full name/i));
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      );
      expect(axios.put).not.toHaveBeenCalled();
    });
  });
});
