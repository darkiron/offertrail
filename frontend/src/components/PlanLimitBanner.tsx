import { useNavigate } from 'react-router-dom';
import type { SubscriptionStatus } from '../types';
import styles from './PlanLimitBanner.module.css';

interface PlanLimitBannerProps {
  sub: SubscriptionStatus | null;
}

export function PlanLimitBanner({ sub }: PlanLimitBannerProps) {
  const navigate = useNavigate();

  if (!sub || sub.is_pro) return null;
  if (!sub.alerte_80) return null;

  const { candidatures_count, candidatures_max } = sub;
  const bloquant = sub.limite_atteinte;

  return (
    <div className={`${styles.banner} ${bloquant ? styles.danger : styles.warning}`}>
      <span className={styles.message}>
        {bloquant
          ? `Limite atteinte — ${candidatures_count}/${candidatures_max} candidatures.`
          : `${candidatures_count}/${candidatures_max} candidatures utilisées.`}
      </span>
      <button
        className={`${styles.cta} ${bloquant ? styles.ctaDanger : styles.ctaWarning}`}
        onClick={() => navigate('/app/mon-compte')}
      >
        Passer en Pro — 14,99 EUR/mois →
      </button>
    </div>
  );
}
