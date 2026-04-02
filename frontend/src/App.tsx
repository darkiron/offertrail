import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
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
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { MonCompte } from './pages/MonCompte';
import { Pricing } from './pages/Pricing';

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

  .app-userMenu {
    position: relative;
  }

  .app-userBtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
    background: transparent;
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .app-userBtn:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
    color: var(--text-main);
  }

  .app-userBtn svg {
    width: 12px;
    height: 12px;
    opacity: 0.5;
    transition: transform 0.15s;
  }

  .app-userBtn.is-open svg {
    transform: rotate(180deg);
  }

  .app-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 180px;
    background: var(--bg-mantle);
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    border-radius: 12px;
    padding: 6px;
    z-index: 200;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }

  .app-dropdownItem {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dim);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    text-decoration: none;
    transition: background 0.1s, color 0.1s;
  }

  .app-dropdownItem:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
    color: var(--text-main);
  }

  .app-dropdownItem.is-danger {
    color: #f09595;
  }

  .app-dropdownItem.is-danger:hover {
    background: rgba(80, 19, 19, 0.6);
  }

  .app-dropdownDivider {
    height: 1px;
    background: color-mix(in srgb, var(--border) 60%, transparent);
    margin: 4px 6px;
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
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

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
              <Link
                to="/"
                className={`app-navLink ${isActive('/') && !isActive('/applications') && !isActive('/organizations') && !isActive('/contacts') && !isActive('/import') ? 'is-active' : ''}`}
              >
                {t('nav.dashboard')}
              </Link>
              <Link to="/applications" className={`app-navLink ${isActive('/applications') ? 'is-active' : ''}`}>{t('nav.applications')}</Link>
              <Link to="/organizations" className={`app-navLink ${isActive('/organizations') || isActive('/companies') ? 'is-active' : ''}`}>{t('nav.organizations')}</Link>
              <Link to="/contacts" className={`app-navLink ${isActive('/contacts') ? 'is-active' : ''}`}>{t('nav.contacts')}</Link>
              <Link to="/import" className={`app-navLink ${isActive('/import') ? 'is-active' : ''}`}>{t('nav.import')}</Link>
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated ? (
            <div className="app-userMenu" ref={dropdownRef}>
              <button
                className={`app-userBtn ${dropdownOpen ? 'is-open' : ''}`}
                onClick={() => setDropdownOpen((o) => !o)}
              >
                {user?.prenom || user?.email?.split('@')[0] || 'Mon compte'}
                <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 1l4 4 4-4" />
                </svg>
              </button>

              {dropdownOpen ? (
                <div className="app-dropdown">
                  <div style={{ padding: '8px 12px 6px', fontSize: '12px', color: 'var(--text-dim)' }}>
                    {user?.email}
                  </div>
                  <div className="app-dropdownDivider" />

                  <Link to="/mon-compte" className="app-dropdownItem" onClick={() => setDropdownOpen(false)}>
                    Mon compte
                  </Link>
                  <Link to="/pricing" className="app-dropdownItem" onClick={() => setDropdownOpen(false)}>
                    Abonnement
                  </Link>

                  <div className="app-dropdownDivider" />

                  <button className="app-dropdownItem is-danger" onClick={handleLogout}>
                    Se déconnecter
                  </button>
                </div>
              ) : null}
            </div>
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
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/pricing" element={<Pricing />} />
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
              <Route path="/mon-compte" element={<ProtectedRoute><MonCompte /></ProtectedRoute>} />
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
