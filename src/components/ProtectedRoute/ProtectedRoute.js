import { useAuthState } from '../../contexts/AuthContext';

function buildLoginRedirectUrl(path) {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

function redirectToLogin(path) {
  window.location.assign(buildLoginRedirectUrl(path));
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthState();

  if (!isAuthenticated) {
    redirectToLogin(window.location.pathname);
    return null;
  }

  return children;
}

export default ProtectedRoute;
