import './MainNav.css';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Features', href: '/features' },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
];

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
  return (
    <nav className="main-nav" aria-label="Main navigation">
      <ul className="main-nav__list">
        {NAV_LINKS.map((link) => (
          <NavItem key={link.href} label={link.label} href={link.href} />
        ))}
      </ul>
    </nav>
  );
}

export default MainNav;
