import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="footer">
      <p className="footer__copyright">
        &copy; {CURRENT_YEAR} My App. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
