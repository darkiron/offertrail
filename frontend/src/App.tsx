import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ScrollToTop } from './components/atoms/ScrollToTop';
import { supabase } from './lib/supabase';

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
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { LandingPage } from './pages/LandingPage';
import { LegalNoticePage } from './pages/LegalNoticePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';
import { MonCompte } from './pages/MonCompte';
import { Pricing } from './pages/Pricing';
import { Admin } from './pages/Admin';
import { Checkout } from './pages/Checkout';
import { HomePage } from './pages/HomePage';
import { CGU } from './pages/legal/CGU';
import { Confidentialite } from './pages/legal/Confidentialite';

import { AppLayout } from './templates/AppLayout';
import { LandingLayout } from './templates/LandingLayout';

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      {/* ── Landing public (LandingLayout) ── */}
      <Route element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      {/* ── Pages légales (layout intégré dans chaque page) ── */}
      <Route path="/cgv" element={<TermsPage />} />
      <Route path="/mentions-legales" element={<LegalNoticePage />} />
      <Route path="/rgpd" element={<PrivacyPolicyPage />} />
      <Route path="/contact" element={<ContactPage />} />
      {/* Public — pas de ProtectedRoute, accessible sans connexion (requis Stripe live) */}
      <Route path="/app/legal/cgu" element={<CGU />} />
      <Route path="/app/legal/confidentialite" element={<Confidentialite />} />

      {/* ── Auth (standalone, pas de layout) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Checkout — protégé (auth) mais pas subscription_status gate ── */}
      <Route path="/app/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

      {/* ── App (AppLayout avec sidebar + header) ── */}
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="candidatures" element={<ApplicationsPage />} />
        <Route path="candidatures/:id" element={<ApplicationDetails />} />
        <Route path="etablissements" element={<OrganizationsPage />} />
        <Route path="etablissements/maintenance" element={<OrganizationMaintenancePage />} />
        <Route path="etablissements/:id" element={<CompanyDetailsPage />} />
        <Route path="companies/:id" element={<CompanyDetailsPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/:id" element={<ContactDetailsPage />} />
        <Route path="import" element={<Import />} />
        <Route path="mon-compte" element={<MonCompte />} />
        <Route path="admin" element={<Admin />} />
        <Route path="pricing" element={<Pricing />} />
      </Route>

      {/* ── Redirects de compatibilité ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
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
