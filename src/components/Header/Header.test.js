import { render, screen } from '@testing-library/react';
import * as authToken from '../../services/authToken';
import { AuthProvider } from '../../contexts/AuthContext';
import Header from './Header';

jest.mock('../../services/authToken');

function renderHeader() {
  authToken.getToken.mockReturnValue(null);
  return render(
    <AuthProvider>
      <Header />
    </AuthProvider>
  );
}

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderHeader();
  });

  it('renders the brand name', () => {
    renderHeader();
    expect(screen.getByText('My App')).toBeInTheDocument();
  });

  it('renders the brand as a link to the home route', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /my app/i })).toHaveAttribute('href', '/');
  });

  it('renders the main navigation', () => {
    renderHeader();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('integrates MainNav without layout issues', () => {
    const { container } = renderHeader();
    const header = container.querySelector('.header');
    expect(header).toContainElement(container.querySelector('.main-nav'));
  });
});
