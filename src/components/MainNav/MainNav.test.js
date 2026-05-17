import { render, screen } from '@testing-library/react';
import MainNav from './MainNav';

describe('MainNav', () => {
  it('renders without crashing', () => {
    render(<MainNav />);
  });

  it('renders a nav element with an accessible label', () => {
    render(<MainNav />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders a list of navigation links', () => {
    render(<MainNav />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders the Home placeholder link', () => {
    render(<MainNav />);
    const link = screen.getByRole('link', { name: /home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the Dashboard placeholder link', () => {
    render(<MainNav />);
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders the Features placeholder link', () => {
    render(<MainNav />);
    const link = screen.getByRole('link', { name: /features/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/features');
  });

  it('renders the Resources placeholder link', () => {
    render(<MainNav />);
    const link = screen.getByRole('link', { name: /resources/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/resources');
  });

  it('renders the Contact placeholder link', () => {
    render(<MainNav />);
    const link = screen.getByRole('link', { name: /contact/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/contact');
  });

  it('renders all five navigation links', () => {
    render(<MainNav />);
    expect(screen.getAllByRole('link')).toHaveLength(5);
  });
});
