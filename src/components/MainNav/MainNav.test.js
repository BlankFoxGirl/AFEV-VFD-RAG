import { render, screen } from '@testing-library/react';
import * as authToken from '../../services/authToken';
import { AuthProvider } from '../../contexts/AuthContext';
import MainNav from './MainNav';

jest.mock('../../services/authToken');

function renderAsGuest() {
  authToken.getToken.mockReturnValue(null);
  return render(
    <AuthProvider>
      <MainNav />
    </AuthProvider>
  );
}

function renderAsAuthenticated() {
  authToken.getToken.mockReturnValue('test-token');
  return render(
    <AuthProvider>
      <MainNav />
    </AuthProvider>
  );
}

describe('MainNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderAsGuest();
  });

  it('renders a nav element with an accessible label', () => {
    renderAsGuest();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders a list of navigation links', () => {
    renderAsGuest();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders the Home link', () => {
    renderAsGuest();
    const link = screen.getByRole('link', { name: /home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the Dashboard link', () => {
    renderAsGuest();
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders the Features link', () => {
    renderAsGuest();
    const link = screen.getByRole('link', { name: /features/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/features');
  });

  it('renders the Resources link', () => {
    renderAsGuest();
    const link = screen.getByRole('link', { name: /resources/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/resources');
  });

  it('renders the Contact link', () => {
    renderAsGuest();
    const link = screen.getByRole('link', { name: /contact/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/contact');
  });

  it('always renders the Register link regardless of auth state', () => {
    renderAsGuest();
    const link = screen.getByRole('link', { name: /register/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  describe('unauthenticated state', () => {
    it('renders the Login link when not authenticated', () => {
      renderAsGuest();
      const link = screen.getByRole('link', { name: /^login$/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/login');
    });

    it('does not render the Profile link when not authenticated', () => {
      renderAsGuest();
      expect(screen.queryByRole('link', { name: /^profile$/i })).not.toBeInTheDocument();
    });

    it('renders seven navigation links when not authenticated', () => {
      renderAsGuest();
      expect(screen.getAllByRole('link')).toHaveLength(7);
    });
  });

  describe('authenticated state', () => {
    it('renders the Profile link when authenticated', () => {
      renderAsAuthenticated();
      const link = screen.getByRole('link', { name: /^profile$/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/profile');
    });

    it('does not render the Login link when authenticated', () => {
      renderAsAuthenticated();
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    });

    it('renders the Register link when authenticated', () => {
      renderAsAuthenticated();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    it('renders seven navigation links when authenticated', () => {
      renderAsAuthenticated();
      expect(screen.getAllByRole('link')).toHaveLength(7);
    });
  });

  describe('component structure consistency', () => {
    it('renders the same number of links regardless of auth state', () => {
      const { unmount } = renderAsGuest();
      const guestLinkCount = screen.getAllByRole('link').length;
      unmount();

      renderAsAuthenticated();
      const authedLinkCount = screen.getAllByRole('link').length;

      expect(guestLinkCount).toBe(authedLinkCount);
    });
  });
});
