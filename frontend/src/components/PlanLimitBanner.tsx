import { useNavigate } from 'react-router-dom';
import type { SubscriptionStatus } from '../types';

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
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '8px',
        border: `1px solid ${bloquant ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.45)'}`,
        background: bloquant ? 'rgba(127, 29, 29, 0.18)' : 'rgba(120, 53, 15, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: bloquant ? '#fecaca' : '#fde68a',
        }}
      >
        {bloquant
          ? `Limite atteinte - ${candidatures_count}/${candidatures_max} candidatures.`
          : `${candidatures_count}/${candidatures_max} candidatures utilisees.`}
      </span>
      <button
        onClick={() => navigate('/app/mon-compte')}
        style={{
          fontSize: '12px',
          fontWeight: 700,
          padding: '6px 12px',
          borderRadius: '999px',
          border: 'none',
          cursor: 'pointer',
          background: bloquant ? '#ef4444' : '#f59e0b',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        Passer en Pro - 9,99EUR/mois {'->'}
      </button>
    </div>
  );
}
