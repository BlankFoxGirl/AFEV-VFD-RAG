import './Header.css';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function NavLink({ label, href }) {
  return (
    <li>
      <a className="header__nav-link" href={href}>
        {label}
      </a>
    </li>
  );
}

function Header() {
  return (
    <header className="header">
      <a className="header__brand" href="/">
        My App
      </a>
      <nav aria-label="Main navigation">
        <ul className="header__nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} label={link.label} href={link.href} />
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
