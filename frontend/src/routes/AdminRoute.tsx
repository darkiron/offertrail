import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { LoadingStatus } from '@shared/ui/LoadingStatus';
import { useI18n } from '../i18n';

export function AdminRoute({ children }: PropsWithChildren) {
  const { profile, isLoading } = useAuth();
  const { t } = useI18n();

  if (isLoading) {
    return <LoadingStatus>{t('common.loading')}</LoadingStatus>;
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
