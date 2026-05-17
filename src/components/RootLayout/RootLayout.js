import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import MainContent from '../MainContent/MainContent';
import './RootLayout.css';

function RootLayout({ children }) {
  return (
    <div className="root-layout">
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </div>
  );
}

export default RootLayout;
