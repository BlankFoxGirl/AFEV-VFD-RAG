import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from './ProfilePage';
import * as profileApi from '../../services/profileApi';

jest.mock('../../services/profileApi');

const mockProfile = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  avatarUrl: null,
};

async function renderLoadedProfilePage() {
  profileApi.fetchProfile.mockResolvedValueOnce({ user: mockProfile });
  render(<ProfilePage />);
  await waitFor(() =>
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-preview-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('loading state', () => {
    it('shows a loading message while profile data is being fetched', () => {
      profileApi.fetchProfile.mockReturnValueOnce(new Promise(() => {}));
      render(<ProfilePage />);
      expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
    });

    it('shows an error banner when profile fetch fails', async () => {
      profileApi.fetchProfile.mockRejectedValueOnce(new Error('Network error'));
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /failed to load profile/i
        )
      );
    });
  });

  describe('profile information display', () => {
    it('pre-fills the name field with current user data', async () => {
      await renderLoadedProfilePage();
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Doe');
    });

    it('pre-fills the email field with current user data', async () => {
      await renderLoadedProfilePage();
      expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
    });

    it('pre-fills the phone field with current user data', async () => {
      await renderLoadedProfilePage();
      expect(screen.getByLabelText(/phone number/i)).toHaveValue('+1234567890');
    });

    it('renders the profile picture section heading', async () => {
      await renderLoadedProfilePage();
      expect(
        screen.getByRole('heading', { name: /profile picture/i })
      ).toBeInTheDocument();
    });

    it('renders the personal information section heading', async () => {
      await renderLoadedProfilePage();
      expect(
        screen.getByRole('heading', { name: /personal information/i })
      ).toBeInTheDocument();
    });

    it('renders the change password section heading', async () => {
      await renderLoadedProfilePage();
      expect(
        screen.getByRole('heading', { name: /change password/i })
      ).toBeInTheDocument();
    });

    it('displays avatar initials placeholder when no avatar URL is set', async () => {
      await renderLoadedProfilePage();
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders an avatar image when avatarUrl is provided', async () => {
      profileApi.fetchProfile.mockResolvedValueOnce({
        user: { ...mockProfile, avatarUrl: 'https://example.com/avatar.jpg' },
      });
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.getByAltText(/profile picture preview/i)).toHaveAttribute(
          'src',
          'https://example.com/avatar.jpg'
        )
      );
    });
  });

  describe('profile picture upload', () => {
    it('shows a preview image after a valid image file is selected', async () => {
      await renderLoadedProfilePage();
      const file = new File(['image-data'], 'photo.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen.getByLabelText(/upload profile picture/i);
      await userEvent.upload(fileInput, file);
      await waitFor(() =>
        expect(
          screen.getByAltText(/profile picture preview/i)
        ).toHaveAttribute('src', 'blob:mock-preview-url')
      );
    });

    it('shows the save picture button after a valid file is selected', async () => {
      await renderLoadedProfilePage();
      const file = new File(['image-data'], 'photo.png', {
        type: 'image/png',
      });
      await userEvent.upload(
        screen.getByLabelText(/upload profile picture/i),
        file
      );
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /save picture/i })
        ).toBeInTheDocument()
      );
    });

    it('shows an error when an unsupported file type is selected', async () => {
      await renderLoadedProfilePage();
      const file = new File(['data'], 'document.pdf', {
        type: 'application/pdf',
      });
      await userEvent.upload(
        screen.getByLabelText(/upload profile picture/i),
        file
      );
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /only jpeg, png, gif, or webp/i
        )
      );
    });

    it('shows an error when the selected file exceeds the size limit', async () => {
      await renderLoadedProfilePage();
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'big.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      await userEvent.upload(
        screen.getByLabelText(/upload profile picture/i),
        file
      );
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /smaller than 5mb/i
        )
      );
    });

    it('shows a success message after avatar upload completes', async () => {
      profileApi.updateAvatar.mockResolvedValueOnce({
        avatarUrl: 'https://cdn.example.com/new-avatar.jpg',
      });
      await renderLoadedProfilePage();
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      await userEvent.upload(
        screen.getByLabelText(/upload profile picture/i),
        file
      );
      await userEvent.click(
        await screen.findByRole('button', { name: /save picture/i })
      );
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(
          /profile picture updated/i
        )
      );
    });

    it('shows an error banner when avatar upload fails', async () => {
      profileApi.updateAvatar.mockRejectedValueOnce(new Error('Upload error'));
      await renderLoadedProfilePage();
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      await userEvent.upload(
        screen.getByLabelText(/upload profile picture/i),
        file
      );
      await userEvent.click(
        await screen.findByRole('button', { name: /save picture/i })
      );
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /failed to upload picture/i
        )
      );
    });
  });

  describe('profile info form', () => {
    it('updates the name field value when the user types', async () => {
      await renderLoadedProfilePage();
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'John Smith');
      expect(nameInput).toHaveValue('John Smith');
    });

    it('shows required error when name is cleared and form is submitted', async () => {
      await renderLoadedProfilePage();
      await userEvent.clear(screen.getByLabelText(/full name/i));
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      );
    });

    it('shows validation error when email format is invalid', async () => {
      await renderLoadedProfilePage();
      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'not-an-email');
      await userEvent.tab();
      await waitFor(() =>
        expect(
          screen.getByText(/enter a valid email address/i)
        ).toBeInTheDocument()
      );
    });

    it('shows validation error when phone number format is invalid', async () => {
      await renderLoadedProfilePage();
      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, 'abc');
      await userEvent.tab();
      await waitFor(() =>
        expect(screen.getByText(/valid phone number/i)).toBeInTheDocument()
      );
    });

    it('calls updateProfile with the correct data on valid submission', async () => {
      profileApi.updateProfile.mockResolvedValueOnce({ user: mockProfile });
      await renderLoadedProfilePage();
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(profileApi.updateProfile).toHaveBeenCalledWith({
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1234567890',
        })
      );
    });

    it('shows a success banner after a successful profile update', async () => {
      profileApi.updateProfile.mockResolvedValueOnce({ user: mockProfile });
      await renderLoadedProfilePage();
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(
          /profile updated successfully/i
        )
      );
    });

    it('shows a server error banner when profile update fails', async () => {
      profileApi.updateProfile.mockRejectedValueOnce({
        response: {
          data: { message: 'Email is already in use.' },
        },
      });
      await renderLoadedProfilePage();
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /email is already in use/i
        )
      );
    });

    it('shows a generic error banner when profile update fails without details', async () => {
      profileApi.updateProfile.mockRejectedValueOnce(new Error('Network Error'));
      await renderLoadedProfilePage();
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /failed to update profile/i
        )
      );
    });
  });

  describe('password change form', () => {
    it('renders current password, new password, and confirm password fields', async () => {
      await renderLoadedProfilePage();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    it('shows required error when current password is empty on submit', async () => {
      await renderLoadedProfilePage();
      await userEvent.click(
        screen.getByRole('button', { name: /update password/i })
      );
      await waitFor(() =>
        expect(
          screen.getByText(/current password is required/i)
        ).toBeInTheDocument()
      );
    });

    it('shows error when new password is shorter than 8 characters', async () => {
      await renderLoadedProfilePage();
      await userEvent.type(screen.getByLabelText(/^new password$/i), 'short');
      await userEvent.tab();
      await waitFor(() =>
        expect(
          screen.getByText(/at least 8 characters/i)
        ).toBeInTheDocument()
      );
    });

    it('shows error when confirm password does not match new password', async () => {
      await renderLoadedProfilePage();
      await userEvent.type(
        screen.getByLabelText(/^new password$/i),
        'newSecurePass1'
      );
      await userEvent.type(
        screen.getByLabelText(/confirm new password/i),
        'differentPass'
      );
      await userEvent.tab();
      await waitFor(() =>
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      );
    });

    it('calls updatePassword with current and new password on valid submission', async () => {
      profileApi.updatePassword.mockResolvedValueOnce({ success: true });
      await renderLoadedProfilePage();
      await userEvent.type(
        screen.getByLabelText(/current password/i),
        'OldPass123'
      );
      await userEvent.type(
        screen.getByLabelText(/^new password$/i),
        'NewPass456'
      );
      await userEvent.type(
        screen.getByLabelText(/confirm new password/i),
        'NewPass456'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /update password/i })
      );
      await waitFor(() =>
        expect(profileApi.updatePassword).toHaveBeenCalledWith({
          currentPassword: 'OldPass123',
          newPassword: 'NewPass456',
        })
      );
    });

    it('shows a success banner and resets fields after successful password update', async () => {
      profileApi.updatePassword.mockResolvedValueOnce({ success: true });
      await renderLoadedProfilePage();
      await userEvent.type(
        screen.getByLabelText(/current password/i),
        'OldPass123'
      );
      await userEvent.type(
        screen.getByLabelText(/^new password$/i),
        'NewPass456'
      );
      await userEvent.type(
        screen.getByLabelText(/confirm new password/i),
        'NewPass456'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /update password/i })
      );
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(
          /password updated successfully/i
        )
      );
      expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    });

    it('shows a server error banner when password update fails', async () => {
      profileApi.updatePassword.mockRejectedValueOnce({
        response: {
          data: { message: 'Current password is incorrect.' },
        },
      });
      await renderLoadedProfilePage();
      await userEvent.type(
        screen.getByLabelText(/current password/i),
        'WrongPass'
      );
      await userEvent.type(
        screen.getByLabelText(/^new password$/i),
        'NewPass456'
      );
      await userEvent.type(
        screen.getByLabelText(/confirm new password/i),
        'NewPass456'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /update password/i })
      );
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /current password is incorrect/i
        )
      );
    });
  });
});
