import MainNav from '../MainNav/MainNav';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <a className="header__brand" href="/">
        My App
      </a>
      <MainNav />
    </header>
  );
}

export default Header;
