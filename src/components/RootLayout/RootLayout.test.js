import { render, screen } from '@testing-library/react';
import * as authToken from '../../services/authToken';
import { AuthProvider } from '../../contexts/AuthContext';
import RootLayout from './RootLayout';

jest.mock('../../services/authToken');

function renderRootLayout(children) {
  authToken.getToken.mockReturnValue(null);
  return render(<AuthProvider><RootLayout>{children}</RootLayout></AuthProvider>);
}

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderRootLayout();
  });

  it('renders the header', () => {
    renderRootLayout();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders the main content area', () => {
    renderRootLayout();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    renderRootLayout();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders children inside the main content area', () => {
    renderRootLayout(<p>Page content</p>);
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByText('Page content'));
  });

  it('renders header before main and main before footer', () => {
    const { container } = renderRootLayout();
    const rootDiv = container.firstChild;
    const children = Array.from(rootDiv.children);
    expect(children[0].tagName.toLowerCase()).toBe('header');
    expect(children[1].tagName.toLowerCase()).toBe('main');
    expect(children[2].tagName.toLowerCase()).toBe('footer');
  });
});
