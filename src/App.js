import { AuthProvider } from './contexts/AuthContext';
import RootLayout from './components/RootLayout/RootLayout';
import HomePage from './components/HomePage/HomePage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import LoginPage from './components/LoginPage/LoginPage';
import ProfilePage from './components/ProfilePage/ProfilePage';

function resolveCurrentPage() {
  const path = window.location.pathname;
  if (path === '/register') return <RegisterPage />;
  if (path === '/login') return <LoginPage />;
  if (path === '/profile') return <ProfilePage />;
  return <HomePage />;
}

function App() {
  return (
    <AuthProvider>
      <RootLayout>{resolveCurrentPage()}</RootLayout>
    </AuthProvider>
  );
}

export default App;
