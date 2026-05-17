import { render, screen } from '@testing-library/react';
import MainContent from './MainContent';

describe('MainContent', () => {
  it('renders without crashing', () => {
    render(<MainContent />);
  });

  it('renders a main element', () => {
    render(<MainContent />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children inside the main element', () => {
    render(
      <MainContent>
        <p>Dynamic page content</p>
      </MainContent>
    );
    expect(screen.getByText('Dynamic page content')).toBeInTheDocument();
  });
});
