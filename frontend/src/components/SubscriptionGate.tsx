import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bloque l'accès aux routes app pour les utilisateurs sans abonnement Pro actif.
 * Redirige vers /app/pricing — page standalone sans AppLayout (pas de menu bypassable).
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();

  if (isLoading) return null;

  if (!profile || profile.plan !== 'pro') {
    return <Navigate to="/app/pricing" replace />;
  }

  return <>{children}</>;
}
