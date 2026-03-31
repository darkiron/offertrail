import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetails } from './pages/ApplicationDetails';
import { CompanyDetailsPage } from './pages/CompanyDetailsPage';
import { ContactDetailsPage } from './pages/ContactDetailsPage';
import { Import } from './pages/Import';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationMaintenancePage } from './pages/OrganizationMaintenancePage';
import { ContactsPage } from './pages/ContactsPage';
import { I18nProvider, useI18n } from './i18n';
import { AuthProvider, useAuth, useRestoreAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';

const appStyles = `
  .app-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at top, rgba(56, 189, 248, 0.08), transparent 26%),
      var(--bg-base);
  }

  .app-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(16px);
    background: color-mix(in srgb, var(--bg-mantle) 84%, transparent 16%);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
  }

  .app-navInner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .app-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--text-main);
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .app-brandMark {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    color: white;
    font-size: 16px;
  }

  .app-navLinks {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .app-navLink {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 10px 14px;
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 700;
  }

  .app-navLink:hover {
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .app-navLink.is-active {
    color: var(--text-main);
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
  }

  .app-footer {
    border-top: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    background: color-mix(in srgb, var(--bg-crust) 82%, transparent 18%);
  }

  .app-footerInner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 18px 24px;
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 700;
  }

  @media (max-width: 820px) {
    .app-navInner {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

const ThemeToggle: React.FC = () => {
  const { t } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('theme') as 'light' | 'dark') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="btn-ghost"
      style={{ padding: '0.45rem 0.7rem', borderRadius: 999 }}
    >
      {theme === 'light' ? t('nav.themeLight') : t('nav.themeDark')}
    </button>
  );
};

const Navbar: React.FC = () => {
  const { t } = useI18n();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className="app-nav">
      <div className="app-navInner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <Link to="/" className="app-brand">
            <span className="app-brandMark">OT</span>
            <span>{t('nav.brand')}</span>
          </Link>
          {isAuthenticated ? (
            <div className="app-navLinks">
              <Link to="/" className={`app-navLink ${isActive('/') && !isActive('/applications') ? 'is-active' : ''}`}>{t('nav.dashboard')}</Link>
              <Link to="/applications" className={`app-navLink ${isActive('/applications') ? 'is-active' : ''}`}>{t('nav.applications')}</Link>
              <Link to="/organizations" className={`app-navLink ${isActive('/organizations') || isActive('/companies') ? 'is-active' : ''}`}>{t('nav.organizations')}</Link>
              <Link to="/contacts" className={`app-navLink ${isActive('/contacts') ? 'is-active' : ''}`}>{t('nav.contacts')}</Link>
              <Link to="/import" className={`app-navLink ${isActive('/import') ? 'is-active' : ''}`}>{t('nav.import')}</Link>
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <>
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{user?.prenom || user?.email}</span>
              <button onClick={logout} className="btn-ghost" style={{ padding: '0.45rem 0.7rem', borderRadius: 999 }}>
                Logout
              </button>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

function App() {
  const { t } = useI18n();
  useRestoreAuth();
  return (
    <>
      <style>{appStyles}</style>
      <Router>
        <div className="app-shell flex flex-col">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
              <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetails /></ProtectedRoute>} />
              <Route path="/organizations" element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>} />
              <Route path="/organizations/maintenance" element={<ProtectedRoute><OrganizationMaintenancePage /></ProtectedRoute>} />
              <Route path="/organizations/:id" element={<ProtectedRoute><CompanyDetailsPage /></ProtectedRoute>} />
              <Route path="/companies/:id" element={<ProtectedRoute><CompanyDetailsPage /></ProtectedRoute>} />
              <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
              <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetailsPage /></ProtectedRoute>} />
              <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
            </Routes>
          </main>

          <footer className="app-footer">
            <div className="app-footerInner">{t('nav.footer')}</div>
          </footer>
        </div>
      </Router>
    </>
  );
}

const AppWithProviders: React.FC = () => (
  <I18nProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </I18nProvider>
);

export default AppWithProviders;
