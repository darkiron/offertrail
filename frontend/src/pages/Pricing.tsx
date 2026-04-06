import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { SubscriptionStatus } from '../types';

const pricingStyles = `
  .pricing-shell {
    min-height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64px 24px 80px;
  }

  .pricing-header {
    text-align: center;
    max-width: 560px;
    margin-bottom: 48px;
  }

  .pricing-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .pricing-title {
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: -0.04em;
    margin: 0 0 14px;
    line-height: 1.05;
  }

  .pricing-subtitle {
    color: var(--text-dim);
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 380px));
    gap: 20px;
    width: 100%;
    max-width: 800px;
  }

  .pricing-card {
    padding: 28px;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 76%, transparent);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .pricing-card.is-featured {
    border-color: color-mix(in srgb, var(--accent) 50%, transparent);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%),
      color-mix(in srgb, var(--bg-mantle) 76%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
  }

  .pricing-cardTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .pricing-plan {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin: 0 0 6px;
  }

  .pricing-amount {
    font-size: 2.4rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1;
    margin: 0;
  }

  .pricing-period {
    font-size: 14px;
    font-weight: 400;
    color: var(--text-dim);
    margin-left: 4px;
  }

  .pricing-badge {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--text-main);
    white-space: nowrap;
  }

  .pricing-badge.is-active {
    background: color-mix(in srgb, #22c55e 20%, transparent);
    color: #86efac;
  }

  .pricing-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pricing-feature {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 0.9rem;
    color: var(--text-dim);
  }

  .pricing-featureCheck {
    color: #86efac;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .pricing-featureCheck.is-muted {
    color: var(--text-dim);
    opacity: 0.5;
  }

  .pricing-cta {
    margin-top: auto;
    display: block;
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    font-weight: 800;
    font-size: 0.95rem;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .pricing-cta.is-primary {
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%));
    color: white;
  }

  .pricing-cta.is-secondary {
    background: color-mix(in srgb, var(--bg-surface) 80%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
    color: var(--text-main);
  }

  .pricing-cta:hover {
    opacity: 0.85;
  }

  .pricing-cta:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .pricing-note {
    margin-top: 32px;
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
  }

  @media (max-width: 640px) {
    .pricing-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const STARTER_FEATURES = [
  { label: '25 candidatures', active: true },
  { label: 'Suivi des statuts', active: true },
  { label: 'Contacts & entreprises', active: true },
  { label: 'Analytics complets', active: false },
  { label: 'Export CSV', active: false },
  { label: 'Relances automatiques', active: false },
];

const PRO_FEATURES = [
  { label: 'Candidatures illimitées', active: true },
  { label: 'Suivi des statuts', active: true },
  { label: 'Contacts & entreprises', active: true },
  { label: 'Analytics complets', active: true },
  { label: 'Export CSV', active: true },
  { label: 'Relances automatiques', active: true },
];

export function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Tarifs — OfferTrail';
    if (isAuthenticated) {
      subscriptionService.getMe().then(setSub).catch(() => {});
    }
  }, [isAuthenticated]);

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
    <>
      <style>{pricingStyles}</style>
      <div className="pricing-shell">
        <div style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
          <button onClick={() => navigate(-1)} className="btn-ghost" style={{ borderRadius: 999, padding: '0.45rem 0.75rem' }}>
            ← Retour
          </button>
        </div>

        <div className="pricing-header">
          <div className="pricing-eyebrow">Tarification</div>
          <h1 className="pricing-title">Simple, sans surprise.</h1>
          <p className="pricing-subtitle">
            Commence gratuitement. Passe en Pro quand tu as besoin de plus.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Starter */}
          <div className="pricing-card">
            <div>
              <div className="pricing-cardTop">
                <div>
                  <p className="pricing-plan">Starter</p>
                  <p className="pricing-amount">0€</p>
                </div>
                {isAuthenticated && !sub?.is_pro ? (
                  <span className="pricing-badge is-active">Plan actuel</span>
                ) : null}
              </div>
            </div>
            <ul className="pricing-features">
              {STARTER_FEATURES.map((f) => (
                <li key={f.label} className="pricing-feature">
                  <span className={`pricing-featureCheck ${f.active ? '' : 'is-muted'}`}>
                    {f.active ? '✓' : '✕'}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              <span className="pricing-cta is-secondary" style={{ cursor: 'default', opacity: 0.6 }}>
                {sub?.is_pro ? 'Plan Starter' : 'Plan actuel'}
              </span>
            ) : (
              <Link to="/register" className="pricing-cta is-secondary">
                Créer un compte gratuit
              </Link>
            )}
          </div>

          {/* Pro */}
          <div className="pricing-card is-featured">
            <div>
              <div className="pricing-cardTop">
                <div>
                  <p className="pricing-plan">Pro</p>
                  <p className="pricing-amount">
                    9,99€<span className="pricing-period">/mois</span>
                  </p>
                </div>
                {sub?.is_pro ? (
                  <span className="pricing-badge is-active">Actif</span>
                ) : (
                  <span className="pricing-badge">Recommandé</span>
                )}
              </div>
            </div>
            <ul className="pricing-features">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className="pricing-feature">
                  <span className="pricing-featureCheck">✓</span>
                  {f.label}
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              sub?.is_pro ? (
                <span className="pricing-cta is-primary" style={{ cursor: 'default' }}>
                  Actif depuis le {sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString('fr-FR') : '-'}
                </span>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="pricing-cta is-primary"
                >
                  {loading ? 'Activation...' : 'Passer en Pro — 9,99€/mois'}
                </button>
              )
            ) : (
              <Link to="/register" className="pricing-cta is-primary">
                Commencer en Pro
              </Link>
            )}
          </div>
        </div>

        <p className="pricing-note">
          Paiement simulé en local · Mollie sera intégré prochainement
        </p>
      </div>
    </>
  );
}
