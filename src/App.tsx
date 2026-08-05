import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { TopNavbar } from './components/layout/TopNavbar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { GlobalFooter } from './components/layout/GlobalFooter';

// Pages
import { Home } from './pages/Home/Home';
import { BookDetails } from './pages/BookDetails/BookDetails';
import { Reader } from './pages/Reader/Reader';
import { Profile } from './pages/Profile/Profile';
import { Wallet } from './pages/Wallet/Wallet';
import { Login } from './pages/Login/Login';
import { Admin } from './pages/Admin/Admin';
import { Browse } from './pages/Browse/Browse';
import { Library } from './pages/Library/Library';

const AppContent: React.FC = () => {
  const location = useLocation();

  const isImmersive = location.pathname.startsWith('/reader') || location.pathname === '/login';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Conditionally show top nav */}
      {!isImmersive && <TopNavbar />}

      {/* Main View Area Offset */}
      <main style={{ 
        flex: 1, 
        marginTop: !isImmersive ? 'var(--nav-height)' : 0,
        paddingBottom: !isImmersive ? 'var(--mobile-nav-height)' : 0
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:bookId" element={<BookDetails />} />
          <Route path="/reader/:bookId/:chapterId" element={<Reader />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </main>

      {/* Conditionally show mobile bottom nav & global footer */}
      {!isImmersive && <BottomNavigation />}
      {!isImmersive && (
        <div className="desktop-only-footer" style={{ display: 'none' }}>
          <GlobalFooter />
        </div>
      )}
      
      {/* Inline media query style to handle desktop footer display */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-only-footer {
            display: block !important;
          }
          main {
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
