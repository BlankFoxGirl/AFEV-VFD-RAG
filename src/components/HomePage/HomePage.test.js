import { render, screen, within } from '@testing-library/react';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders without crashing', () => {
    render(<HomePage />);
  });

  it('renders the welcome heading', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { name: /welcome to my app/i })
    ).toBeInTheDocument();
  });

  it('renders the quick navigation section', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('region', { name: /quick navigation/i })
    ).toBeInTheDocument();
  });

  it('renders the Authentication navigation link with the correct route', () => {
    render(<HomePage />);
    const link = screen.getByRole('link', { name: /authentication/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/auth');
  });

  it('renders the Claim Extraction navigation link with the correct route', () => {
    render(<HomePage />);
    const link = screen.getByRole('link', { name: /claim extraction/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/claim-extraction');
  });

  it('renders the Dashboard navigation link with the correct route', () => {
    render(<HomePage />);
    const navSection = screen.getByRole('region', { name: /quick navigation/i });
    const link = within(navSection).getByRole('link', { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders the Resources navigation link with the correct route', () => {
    render(<HomePage />);
    const navSection = screen.getByRole('region', { name: /quick navigation/i });
    const link = within(navSection).getByRole('link', { name: /resources/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/resources');
  });

  it('renders all four feature navigation links', () => {
    render(<HomePage />);
    const navSection = screen.getByRole('region', { name: /quick navigation/i });
    expect(within(navSection).getAllByRole('link')).toHaveLength(4);
  });

  it('integrates navigation links alongside the welcome and features sections', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('region', { name: /quick navigation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /application overview/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /feature highlights/i })
    ).toBeInTheDocument();
  });
});
