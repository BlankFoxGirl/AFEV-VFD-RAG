import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
  });

  it('renders copyright information', () => {
    render(<Footer />);
    expect(screen.getByText(/my app\. all rights reserved\./i)).toBeInTheDocument();
  });

  it('renders the current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
