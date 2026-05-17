import { render, screen } from '@testing-library/react';
import RootLayout from './RootLayout';

describe('RootLayout', () => {
  it('renders without crashing', () => {
    render(<RootLayout />);
  });

  it('renders the header', () => {
    render(<RootLayout />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the main content area', () => {
    render(<RootLayout />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<RootLayout />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders children inside the main content area', () => {
    render(
      <RootLayout>
        <p>Page content</p>
      </RootLayout>
    );
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByText('Page content'));
  });

  it('renders header before main and main before footer', () => {
    const { container } = render(<RootLayout />);
    const rootDiv = container.firstChild;
    const children = Array.from(rootDiv.children);
    expect(children[0].tagName.toLowerCase()).toBe('header');
    expect(children[1].tagName.toLowerCase()).toBe('main');
    expect(children[2].tagName.toLowerCase()).toBe('footer');
  });
});
