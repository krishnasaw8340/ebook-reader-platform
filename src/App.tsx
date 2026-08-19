import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { TopNavbar } from './components/layout/TopNavbar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { GlobalFooter } from './components/layout/GlobalFooter';

// Reader Pages
import { Home } from './pages/Home/Home';
import { BookDetails } from './pages/BookDetails/BookDetails';
import { Reader } from './pages/Reader/Reader';
import { Profile } from './pages/Profile/Profile';
import { Wallet } from './pages/Wallet/Wallet';
import { Login } from './pages/Login/Login';
import { Browse } from './pages/Browse/Browse';
import { Library } from './pages/Library/Library';

// Admin CMS
import { AdminRoute } from './admin/guards/AdminRoute';
import { AdminLayout } from './admin/layout/AdminLayout';
import { AdminDashboard } from './admin/dashboard/AdminDashboard';
import { AdminBooks } from './admin/books/AdminBooks';
import { AdminSeries } from './admin/series/AdminSeries';
import { AdminVolumes } from './admin/volumes/AdminVolumes';
import { AdminChapters } from './admin/chapters/AdminChapters';
import { AdminPages } from './admin/pages/AdminPages';
import { AdminUsers } from './admin/users/AdminUsers';
import { AdminPricing } from './admin/pricing/AdminPricing';

const AppContent: React.FC = () => {
  const location = useLocation();

  const isImmersive =
    location.pathname.startsWith('/reader') ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Conditionally show top nav for reader-facing application */}
      {!isImmersive && <TopNavbar />}

      {/* Main View Area Offset */}
      <main style={{ 
        flex: 1, 
        marginTop: !isImmersive ? 'var(--nav-height)' : 0,
        paddingBottom: !isImmersive ? 'var(--mobile-nav-height)' : 0
      }}>
        <Routes>
          {/* Reader Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/book/:bookId" element={<BookDetails />} />
          <Route path="/reader/:bookId/:chapterId" element={<Reader />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/login" element={<Login />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/library" element={<Library />} />

          {/* Admin CMS Nested Routes with Guard */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="series" element={<AdminSeries />} />
            <Route path="volumes" element={<AdminVolumes />} />
            <Route path="chapters" element={<AdminChapters />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="pricing" element={<AdminPricing />} />
          </Route>
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
