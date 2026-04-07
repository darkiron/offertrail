import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Dashboard } from './pages/Dashboard';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetails } from './pages/ApplicationDetails';
import { CompanyDetailsPage } from './pages/CompanyDetailsPage';
import { ContactDetailsPage } from './pages/ContactDetailsPage';
import { Import } from './pages/Import';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationMaintenancePage } from './pages/OrganizationMaintenancePage';
import { ContactsPage } from './pages/ContactsPage';
import { I18nProvider } from './i18n';
import { AuthProvider, useRestoreAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { MonCompte } from './pages/MonCompte';
import { Pricing } from './pages/Pricing';
import { Admin } from './pages/Admin';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';

import { AppLayout } from './templates/AppLayout';
import { LandingLayout } from './templates/LandingLayout';

function AppRoutes() {
  useRestoreAuth();

  return (
    <Routes>
      {/* ── Landing public (LandingLayout) ── */}
      <Route element={<LandingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/cgv" element={<LegalPage />} />
        <Route path="/mentions-legales" element={<LegalPage />} />
        <Route path="/rgpd" element={<LegalPage />} />
      </Route>

      {/* ── Auth (standalone, pas de layout) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── App (AppLayout avec sidebar + header) ── */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>

      {/* ── Redirects de compatibilité ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
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
