import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './RegisterPage';
import * as registrationApi from '../../services/registrationApi';

jest.mock('../../services/registrationApi');

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
};

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RegisterPage />);
  });

  it('renders the email field with label', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders the password field with label', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('renders the confirm password field with label', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('shows validation error when email is invalid', async () => {
    render(<RegisterPage />);
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'not-an-email');
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    );
  });

  it('shows required error when email is empty and form is submitted', async () => {
    render(<RegisterPage />);
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() =>
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    );
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different');
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    );
  });

  it('integrates with RootLayout as a page child', () => {
    const { container } = render(
      <div className="root-layout">
        <main>
          <RegisterPage />
        </main>
      </div>
    );
    expect(container.querySelector('main')).toContainElement(
      screen.getByRole('button', { name: /register/i })
    );
  });

  it('renders the form inside a card visible at mobile viewport', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  describe('integration: API submission', () => {
    it('displays success message after successful registration', async () => {
      registrationApi.registerUser.mockResolvedValueOnce({
        success: true,
        user: { id: '1', email: 'user@example.com' },
      });

      render(<RegisterPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() =>
        expect(
          screen.getByText(/registration successful/i)
        ).toBeInTheDocument()
      );
    });

    it('calls registerUser with email and password on valid submission', async () => {
      registrationApi.registerUser.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() =>
        expect(registrationApi.registerUser).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123',
        })
      );
    });

    it('displays server error message when registration fails with email conflict', async () => {
      registrationApi.registerUser.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { success: false, errors: { email: 'Email is already registered' } },
        },
      });

      render(<RegisterPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() =>
        expect(
          screen.getByText(/email is already registered/i)
        ).toBeInTheDocument()
      );
    });

    it('displays generic error message when registration fails without specific error', async () => {
      registrationApi.registerUser.mockRejectedValueOnce(new Error('Network Error'));

      render(<RegisterPage />);
      await fillValidForm();
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() =>
        expect(
          screen.getByText(/registration failed/i)
        ).toBeInTheDocument()
      );
    });
  });
});
