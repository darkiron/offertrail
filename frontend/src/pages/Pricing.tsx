import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';

export function Pricing() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Abonnement — OfferTrail';
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await subscriptionService.upgrade();
      const updated = await subscriptionService.getMe();
      setSub(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ borderRadius: 999, padding: '0.45rem 0.75rem' }}>
          {'<-'} Retour
        </button>
        <h1 style={{ marginTop: '1rem' }}>Passer en Pro</h1>
        {sub ? (
          <p>
            Plan actuel : <strong>{sub.is_pro ? 'Pro' : 'Starter (gratuit)'}</strong>
          </p>
        ) : null}
      </div>

      <div
        style={{
          border: '1px solid rgba(14, 165, 233, 0.35)',
          borderRadius: '12px',
          padding: '1.5rem',
          background: 'var(--bg-mantle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'var(--text-dim)',
                margin: '0 0 4px',
              }}
            >
              Pro
            </p>
            <p style={{ fontSize: '28px', fontWeight: 500, margin: 0 }}>
              9,99€
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-dim)' }}>/mois</span>
            </p>
          </div>
          {sub?.is_pro ? (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                background: 'rgba(34, 197, 94, 0.18)',
                color: '#86efac',
                padding: '2px 10px',
                borderRadius: '99px',
              }}
            >
              Actif
            </span>
          ) : null}
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Candidatures illimitées',
            'Analytics complets',
            'Export CSV',
            'Relances',
            'Score de probité',
          ].map((feature) => (
            <li key={feature} style={{ fontSize: '13px', color: 'var(--text-dim)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#86efac' }}>✓</span> {feature}
            </li>
          ))}
        </ul>

        {sub?.is_pro ? (
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
            Actif depuis le {sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString('fr-FR') : '-'}
          </p>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '10px', fontWeight: 500, borderRadius: 10 }}
          >
            {loading ? 'Activation...' : 'Passer en Pro — 9,99€/mois'}
          </button>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
        Paiement simulé en local · Mollie sera intégré prochainement
      </p>
    </div>
  );
}
