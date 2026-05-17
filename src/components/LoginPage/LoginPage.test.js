import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import * as loginApi from '../../services/loginApi';

jest.mock('../../services/loginApi');

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LoginPage />);
  });

  it('renders the email field with correct placeholder', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
  });

  it('renders the password field with correct placeholder', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('renders the email field with label', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders the password field with label', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('renders the sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the forgot password link', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('renders the register link', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('forgot password link points to /forgot-password', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('register link points to /register', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('shows validation error when email is invalid', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'not-an-email');
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    );
  });

  it('shows required error when email is empty and form is submitted', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    );
  });

  it('shows required error when password is empty and form is submitted', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    );
  });

  it('shows error when password is shorter than 8 characters', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/^password$/i), 'short');
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    );
  });

  it('renders the form inside a card visible at mobile viewport', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  describe('integration: API submission', () => {
    it('redirects to dashboard after successful login', async () => {
      const assignMock = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { assign: assignMock },
      });

      loginApi.loginUser.mockResolvedValueOnce({
        success: true,
        user: { id: '1', email: 'user@example.com' },
      });

      render(<LoginPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(assignMock).toHaveBeenCalledWith('/dashboard')
      );
    });

    it('calls loginUser with email and password on valid submission', async () => {
      loginApi.loginUser.mockResolvedValueOnce({ success: true });

      render(<LoginPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(loginApi.loginUser).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123',
        })
      );
    });

    it('displays server error message when credentials are invalid', async () => {
      loginApi.loginUser.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { success: false, message: 'Invalid email or password.' },
        },
      });

      render(<LoginPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      );
    });

    it('displays generic error message when login fails without specific error', async () => {
      loginApi.loginUser.mockRejectedValueOnce(new Error('Network Error'));

      render(<LoginPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() =>
        expect(screen.getByText(/login failed/i)).toBeInTheDocument()
      );
    });
  });
});
