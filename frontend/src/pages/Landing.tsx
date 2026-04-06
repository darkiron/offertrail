import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const landingStyles = `
  .landing-shell {
    min-height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px 80px;
  }

  .landing-hero {
    width: min(760px, 100%);
    text-align: center;
  }

  .landing-eyebrow {
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
    margin-bottom: 28px;
  }

  .landing-title {
    font-size: clamp(2.4rem, 6vw, 4.2rem);
    line-height: 1.05;
    letter-spacing: -0.04em;
    margin: 0 0 20px;
  }

  .landing-subtitle {
    font-size: 1.15rem;
    color: var(--text-dim);
    max-width: 520px;
    margin: 0 auto 40px;
    line-height: 1.6;
  }

  .landing-ctas {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .landing-ctaPrimary {
    padding: 14px 28px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%));
    color: white;
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.01em;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .landing-ctaPrimary:hover {
    opacity: 0.88;
  }

  .landing-ctaSecondary {
    padding: 14px 28px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg-surface) 80%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
    color: var(--text-main);
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: background 0.2s;
  }

  .landing-ctaSecondary:hover {
    background: color-mix(in srgb, var(--bg-surface) 100%, transparent);
  }

  .landing-features {
    margin-top: 72px;
    width: min(900px, 100%);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .landing-feature {
    padding: 22px 20px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--bg-mantle) 76%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
    text-align: left;
  }

  .landing-featureTitle {
    font-size: 0.95rem;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .landing-featureCopy {
    color: var(--text-dim);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  @media (max-width: 680px) {
    .landing-features {
      grid-template-columns: 1fr;
    }
  }
`;

export function Landing() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'OfferTrail — Suivi de candidatures';
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <style>{landingStyles}</style>
      <div className="landing-shell">
        <div className="landing-hero">
          <div className="landing-eyebrow">OfferTrail Workspace</div>
          <h1 className="landing-title">
            Reprends la main sur<br />ton pipeline de candidatures.
          </h1>
          <p className="landing-subtitle">
            Un suivi local-first, structuré comme un CRM. Ton historique, tes relances et tes contacts dans un même espace.
          </p>
          <div className="landing-ctas">
            <Link to="/register" className="landing-ctaPrimary">Créer un compte</Link>
            <Link to="/login" className="landing-ctaSecondary">Se connecter</Link>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link to="/pricing" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Voir les tarifs
            </Link>
          </div>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-featureTitle">Vue pipeline exploitable</div>
            <div className="landing-featureCopy">Retrouve rapidement ce qui est en attente, ce qui ghoste et ce qui demande une relance.</div>
          </div>
          <div className="landing-feature">
            <div className="landing-featureTitle">Contexte entreprise + contact</div>
            <div className="landing-featureCopy">Chaque candidature garde son contexte, ses notes et son historique d'interactions.</div>
          </div>
          <div className="landing-feature">
            <div className="landing-featureTitle">Base locale propre</div>
            <div className="landing-featureCopy">Tes données restent chez toi, avec une structure SaaS prête pour la suite.</div>
          </div>
        </div>
      </div>
    </>
  );
}
