import './MainNav.css';
import { useAuthState } from '../../contexts/AuthContext';

const BASE_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Features', href: '/features' },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
];

const ALWAYS_VISIBLE_LINKS = [{ label: 'Register', href: '/register' }];

const GUEST_ONLY_LINKS = [{ label: 'Login', href: '/login' }];

const AUTHENTICATED_ONLY_LINKS = [{ label: 'Profile', href: '/profile' }];

function resolveAuthLinks(isAuthenticated) {
  return isAuthenticated ? AUTHENTICATED_ONLY_LINKS : GUEST_ONLY_LINKS;
}

function buildNavLinks(isAuthenticated) {
  return [...BASE_NAV_LINKS, ...ALWAYS_VISIBLE_LINKS, ...resolveAuthLinks(isAuthenticated)];
}

function NavItem({ label, href }) {
  return (
    <li className="main-nav__item">
      <a className="main-nav__link" href={href}>
        {label}
      </a>
    </li>
  );
}

function MainNav() {
  const { isAuthenticated } = useAuthState();
  const navLinks = buildNavLinks(isAuthenticated);

  return (
    <nav className="main-nav" aria-label="Main navigation">
      <ul className="main-nav__list">
        {navLinks.map((link) => (
          <NavItem key={link.href} label={link.label} href={link.href} />
        ))}
      </ul>
    </nav>
  );
}

export default MainNav;
