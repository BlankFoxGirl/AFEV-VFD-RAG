import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContext from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');

describe('ProtectedRoute', () => {
  let assignMock;

  beforeEach(() => {
    assignMock = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { assign: assignMock, pathname: '/profile' },
    });
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      AuthContext.useAuthState.mockReturnValue({ isAuthenticated: true });
    });

    it('renders children when user is authenticated', () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not redirect when user is authenticated', () => {
      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(assignMock).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated user', () => {
    beforeEach(() => {
      AuthContext.useAuthState.mockReturnValue({ isAuthenticated: false });
    });

    it('redirects to login when user is not authenticated', () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(assignMock).toHaveBeenCalledWith('/login?redirect=%2Fprofile');
    });

    it('renders nothing while redirecting unauthenticated user', () => {
      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('does not render children when user is not authenticated', () => {
      render(
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });

    it('includes the current path as redirect param in the login URL', () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { assign: assignMock, pathname: '/profile' },
      });

      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(assignMock).toHaveBeenCalledWith(
        expect.stringContaining('redirect=%2Fprofile')
      );
    });
  });
});
