import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CHECKOUT_PATH = '/app/checkout';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Abonnement requis pour tout chemin sauf /app/checkout lui-même
  if (
    profile &&
    profile.subscription_status !== 'active' &&
    location.pathname !== CHECKOUT_PATH
  ) {
    return <Navigate to={CHECKOUT_PATH} replace />;
  }

  return <>{children}</>;
}
