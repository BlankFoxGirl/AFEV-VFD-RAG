import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('renders the header', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<App />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders welcome heading in the main content area', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /welcome to my app/i })).toBeInTheDocument();
  });
});
