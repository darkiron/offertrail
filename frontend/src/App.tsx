import React, { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useParams,
} from 'react-router-dom';
import { I18nProvider, useI18n } from './i18n';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import appClasses from './App.module.scss';

import { AppLayout } from './templates/AppLayout';
import { LandingLayout as PublicLayout } from './templates/LandingLayout';
import { LoadingStatus } from './components/atoms/LoadingStatus';
import { PublicBrand } from './components/atoms/PublicBrand';

const named = <T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(async () => ({ default: (await loader())[name] }));
const Dashboard = named(() => import('./pages/Dashboard'), 'Dashboard');
const ApplicationsPage = named(
  () => import('./pages/ApplicationsPage'),
  'ApplicationsPage',
);
const ApplicationDetails = named(
  () => import('./pages/ApplicationDetails'),
  'ApplicationDetails',
);
const CompanyDetailsPage = named(
  () => import('./pages/CompanyDetailsPage'),
  'CompanyDetailsPage',
);
const ContactDetailsPage = named(
  () => import('./pages/ContactDetailsPage'),
  'ContactDetailsPage',
);
const Import = named(() => import('./pages/Import'), 'Import');
const OrganizationsPage = named(
  () => import('./pages/OrganizationsPage'),
  'OrganizationsPage',
);
const OrganizationMaintenancePage = named(
  () => import('./pages/OrganizationMaintenancePage'),
  'OrganizationMaintenancePage',
);
const ContactsPage = named(
  () => import('./pages/ContactsPage'),
  'ContactsPage',
);
const LoginPage = named(() => import('./pages/Login'), 'LoginPage');
const RegisterPage = named(() => import('./pages/Register'), 'RegisterPage');
const ForgotPasswordPage = named(
  () => import('./pages/ForgotPassword'),
  'ForgotPasswordPage',
);
const ResetPasswordPage = named(
  () => import('./pages/ResetPassword'),
  'ResetPasswordPage',
);
const LandingPage = named(() => import('./pages/LandingPage'), 'LandingPage');
const LegalNoticePage = named(
  () => import('./pages/LegalNoticePage'),
  'LegalNoticePage',
);
const PrivacyPolicyPage = named(
  () => import('./pages/PrivacyPolicyPage'),
  'PrivacyPolicyPage',
);
const TermsPage = named(() => import('./pages/TermsPage'), 'TermsPage');
const ContactPage = named(() => import('./pages/ContactPage'), 'ContactPage');
const MonCompte = named(() => import('./pages/MonCompte'), 'MonCompte');
const Admin = named(() => import('./pages/Admin'), 'Admin');
const Checkout = named(() => import('./pages/Pricing'), 'Pricing');
const CGU = named(() => import('./pages/legal/CGU'), 'CGU');

function CompanyAliasRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/etablissements/${id ?? ''}`} replace />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/app') && !hash) window.scrollTo(0, 0);
  }, [hash, pathname]);
  return null;
}

function NotFoundPage() {
  const { t } = useI18n();
  useEffect(() => {
    document.title = t('common.notFoundPageTitle');
    const robots = document.querySelector('meta[name="robots"]');
    robots?.setAttribute('content', 'noindex,follow');
    return () =>
      robots?.setAttribute('content', 'index,follow,max-image-preview:large');
  }, [t]);

  return (
    <main className={appClasses.notFound}>
      <p className={appClasses.notFoundEyebrow}>
        {t('common.notFoundEyebrow')}
      </p>
      <h1>{t('common.notFoundTitle')}</h1>
      <p>{t('common.notFoundBody')}</p>
      <Link to="/">{t('common.notFoundBack')}</Link>
    </main>
  );
}

function RouteLoading() {
  const { t } = useI18n();
  return (
    <main className={appClasses.routeLoading} role="status">
      <PublicBrand />
      <LoadingStatus>{t('common.loading')}</LoadingStatus>
    </main>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          {/* ── Pages publiques (LandingLayout) ── */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="/cgv" element={<TermsPage />} />
            <Route path="/terms" element={<Navigate to="/cgv" replace />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/mentions-legales" element={<LegalNoticePage />} />
            <Route
              path="/legal-notice"
              element={<Navigate to="/mentions-legales" replace />}
            />
            <Route path="/rgpd" element={<PrivacyPolicyPage />} />
            <Route path="/privacy" element={<Navigate to="/rgpd" replace />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* Public — accessible sans connexion (requis Stripe live) */}
            <Route
              path="/app/legal/cgu"
              element={<Navigate to="/cgu" replace />}
            />
            <Route
              path="/app/legal/terms-of-use"
              element={<Navigate to="/cgu" replace />}
            />
            <Route
              path="/app/legal/confidentialite"
              element={<Navigate to="/rgpd" replace />}
            />
            <Route
              path="/app/legal/privacy-policy"
              element={<Navigate to="/rgpd" replace />}
            />
            <Route
              path="/app/legal/cgv"
              element={<Navigate to="/cgv" replace />}
            />
          </Route>

          {/* ── Auth (standalone, pas de layout) ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Checkout — protégé (auth) mais pas subscription_status gate ── */}
          <Route
            path="/app/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* ── App (AppLayout avec sidebar + header) ── */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="candidatures" element={<ApplicationsPage />} />
            <Route path="candidatures/:id" element={<ApplicationDetails />} />
            <Route path="etablissements" element={<OrganizationsPage />} />
            <Route
              path="etablissements/maintenance"
              element={<OrganizationMaintenancePage />}
            />
            <Route path="etablissements/:id" element={<CompanyDetailsPage />} />
            <Route path="companies/:id" element={<CompanyAliasRedirect />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactDetailsPage />} />
            <Route path="import" element={<Import />} />
            <Route path="mon-compte" element={<MonCompte />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            {/* Legacy URL kept as a redirect: subscription actions live in account/checkout. */}
            <Route
              path="pricing"
              element={
                <Navigate to="/app/checkout?plan=pro&period=monthly" replace />
              }
            />
          </Route>

          {/* ── Redirects de compatibilité ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
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
