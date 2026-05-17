import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders without crashing', () => {
    render(<Header />);
  });

  it('renders the brand name', () => {
    render(<Header />);
    expect(screen.getByText('My App')).toBeInTheDocument();
  });

  it('renders the brand as a link to the home route', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /my app/i })).toHaveAttribute('href', '/');
  });

  it('renders the main navigation', () => {
    render(<Header />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('integrates MainNav without layout issues', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('.header');
    expect(header).toContainElement(container.querySelector('.main-nav'));
  });
});
