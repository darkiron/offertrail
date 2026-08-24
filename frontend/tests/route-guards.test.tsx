import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AdminRoute } from '../src/components/AdminRoute';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { AuthContext, type AuthContextType } from '../src/context/auth-context';
import { I18nProvider } from '../src/i18n';

const noop = async () => undefined;
const baseAuth: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isPasswordRecovery: false,
  signUp: noop,
  signIn: noop,
  signOut: noop,
  refreshProfile: noop,
};

function LocationState() {
  const location = useLocation();
  return <output>{JSON.stringify(location.state)}</output>;
}

function renderRoutes(auth: AuthContextType, children: ReactNode) {
  return render(
    <I18nProvider>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/app/candidatures?status=active']}>
          <Routes>
            <Route path="/app/candidatures" element={children} />
            <Route
              path="/login"
              element={
                <>
                  <h1>Login</h1>
                  <LocationState />
                </>
              }
            />
            <Route path="/app" element={<h1>Dashboard</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nProvider>,
  );
}

test('ProtectedRoute redirects guests and preserves their intended destination', () => {
  renderRoutes(
    baseAuth,
    <ProtectedRoute>
      <h1>Applications</h1>
    </ProtectedRoute>,
  );

  expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  expect(
    screen.getByText(/\/app\/candidatures\?status=active/),
  ).toBeInTheDocument();
});

test('ProtectedRoute renders the protected content for an authenticated user', () => {
  renderRoutes(
    { ...baseAuth, isAuthenticated: true },
    <ProtectedRoute>
      <h1>Applications</h1>
    </ProtectedRoute>,
  );

  expect(
    screen.getByRole('heading', { name: 'Applications' }),
  ).toBeInTheDocument();
});

test('AdminRoute rejects a non-admin before rendering admin content', () => {
  renderRoutes(
    {
      ...baseAuth,
      isAuthenticated: true,
      profile: {
        id: 'user-1',
        prenom: null,
        nom: null,
        subscription_status: 'free',
        role: 'user',
        plan_started_at: null,
        created_at: null,
      },
    },
    <AdminRoute>
      <h1>Administration</h1>
    </AdminRoute>,
  );

  expect(
    screen.getByRole('heading', { name: 'Dashboard' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('Administration')).not.toBeInTheDocument();
});
