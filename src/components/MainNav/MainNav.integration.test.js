import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import MainNav from './MainNav';

function renderNav() {
  return render(
    <AuthProvider>
      <MainNav />
    </AuthProvider>
  );
}

describe('MainNav integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('unauthenticated state (no token in storage)', () => {
    it('shows the Login link when no auth token is stored', () => {
      renderNav();
      expect(screen.getByRole('link', { name: /^login$/i })).toBeInTheDocument();
    });

    it('does not show the Profile link when no auth token is stored', () => {
      renderNav();
      expect(screen.queryByRole('link', { name: /^profile$/i })).not.toBeInTheDocument();
    });

    it('shows the Register link when no auth token is stored', () => {
      renderNav();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });
  });

  describe('authenticated state (token present in storage)', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-jwt-token');
    });

    it('shows the Profile link when an auth token is stored', () => {
      renderNav();
      expect(screen.getByRole('link', { name: /^profile$/i })).toBeInTheDocument();
    });

    it('does not show the Login link when an auth token is stored', () => {
      renderNav();
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    });

    it('shows the Register link when an auth token is stored', () => {
      renderNav();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    it('links the Profile entry to /profile', () => {
      renderNav();
      expect(screen.getByRole('link', { name: /^profile$/i })).toHaveAttribute('href', '/profile');
    });
  });
});
