import { createContext, useContext, useEffect, useState } from 'react';
import { getToken } from '../services/authToken';

const AuthContext = createContext(null);

function resolveIsAuthenticated() {
  return Boolean(getToken());
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(resolveIsAuthenticated);

  useEffect(() => {
    function handleStorageChange() {
      setIsAuthenticated(resolveIsAuthenticated());
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
