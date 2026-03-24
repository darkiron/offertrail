import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationDetailsPage } from './pages/ApplicationDetailsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyDetailsPage } from './pages/CompanyDetailsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { Import } from './pages/Import';
import { useParams } from 'react-router-dom';

const ApplicationDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <ApplicationDetailsPage id={parseInt(id || '0')} />;
};

const CompanyDetailsWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <CompanyDetailsPage id={parseInt(id || '0')} />;
};

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="btn-ghost"
      style={{ padding: '0.25rem 0.5rem', borderRadius: '50%' }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-lg">
          <Link to="/" className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            🧭 OfferTrail
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/companies" className={`nav-link ${isActive('/companies') ? 'active' : ''}`}>Companies</Link>
            <Link to="/applications" className={`nav-link ${isActive('/applications') ? 'active' : ''}`}>Applications</Link>
            <Link to="/import" className={`nav-link ${isActive('/import') ? 'active' : ''}`}>Import</Link>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="flex flex-col" style={{ minHeight: '100vh' }}>
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:id" element={<CompanyDetailsWrapper />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailsWrapper />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container has-text-centered text-sm text-dim font-bold">
            OFFERTRAIL © 2026 — MODERN REACT ATOMIC UI
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
