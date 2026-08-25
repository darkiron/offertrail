import type { SubscriptionStatus } from '../../types';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import classes from './PlanLimitBanner.module.scss';

interface PlanLimitBannerProps {
  sub: SubscriptionStatus | null;
}

export function PlanLimitBanner({ sub }: PlanLimitBannerProps) {
  const { t } = useI18n();
  if (!sub || sub.is_active || sub.plan === 'free') return null;
  return (
    <aside className={classes.banner} role="status">
      <div>
        <strong>{t('monCompte.inactivePlanTitle')}</strong>
        <span>{t('monCompte.inactivePlanDescription')}</span>
      </div>
      <Link to="/app/mon-compte#facturation">
        {t('monCompte.manageBilling')}
      </Link>
    </aside>
  );
}
