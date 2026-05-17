import RootLayout from './components/RootLayout/RootLayout';
import HomePage from './components/HomePage/HomePage';
import RegisterPage from './components/RegisterPage/RegisterPage';

function resolveCurrentPage() {
  const path = window.location.pathname;
  if (path === '/register') return <RegisterPage />;
  return <HomePage />;
}

function App() {
  return <RootLayout>{resolveCurrentPage()}</RootLayout>;
}

export default App;
