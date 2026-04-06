import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const landingStyles = `
  .landing-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* ── Nav ── */
  .landing-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(16px);
    background: color-mix(in srgb, var(--bg-mantle) 84%, transparent 16%);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
  }

  .landing-navInner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .landing-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: -0.02em;
    text-decoration: none;
    color: var(--text-main);
  }

  .landing-brandMark {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 70%, white 30%));
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 900;
    color: white;
    letter-spacing: -0.02em;
  }

  .landing-navLinks {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .landing-navLink {
    padding: 7px 14px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }

  .landing-navLink:hover {
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .landing-navActions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .landing-navLogin {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-main);
    text-decoration: none;
    border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
    transition: background 0.15s;
  }

  .landing-navLogin:hover {
    background: color-mix(in srgb, var(--bg-surface) 80%, transparent);
  }

  .landing-navRegister {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 800;
    color: white;
    text-decoration: none;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 78%, white 22%));
    transition: opacity 0.15s;
  }

  .landing-navRegister:hover {
    opacity: 0.88;
  }

  /* ── Hero ── */
  .landing-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .landing-hero {
    width: min(760px, 100%);
    text-align: center;
    padding: 80px 24px 56px;
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

  .landing-ctaPrimary:hover { opacity: 0.88; }

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

  /* ── Features ── */
  .landing-features {
    width: min(980px, 100%);
    padding: 0 24px 72px;
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

  /* ── Footer ── */
  .landing-footer {
    border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 60%, transparent);
  }

  .landing-footerInner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .landing-footerBrand {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-dim);
  }

  .landing-footerLinks {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .landing-footerLink {
    font-size: 0.85rem;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.15s;
  }

  .landing-footerLink:hover {
    color: var(--text-main);
  }

  @media (max-width: 680px) {
    .landing-features {
      grid-template-columns: 1fr;
    }

    .landing-navLinks {
      display: none;
    }

    .landing-footerInner {
      flex-direction: column;
      align-items: flex-start;
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
      <div className="landing-root">

        {/* Nav publique */}
        <nav className="landing-nav">
          <div className="landing-navInner">
            <Link to="/" className="landing-brand">
              <span className="landing-brandMark">OT</span>
              OfferTrail
            </Link>
            <div className="landing-navLinks">
              <Link to="/pricing" className="landing-navLink">Tarifs</Link>
              <Link to="/mentions-legales" className="landing-navLink">Mentions légales</Link>
              <Link to="/cgv" className="landing-navLink">CGV</Link>
            </div>
            <div className="landing-navActions">
              <Link to="/login" className="landing-navLogin">Se connecter</Link>
              <Link to="/register" className="landing-navRegister">Créer un compte</Link>
            </div>
          </div>
        </nav>

        <main className="landing-main">
          {/* Hero */}
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
              <Link to="/pricing" className="landing-ctaSecondary">Voir les tarifs</Link>
            </div>
          </div>

          {/* Features */}
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
        </main>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="landing-footerInner">
            <span className="landing-footerBrand">© {new Date().getFullYear()} OfferTrail</span>
            <div className="landing-footerLinks">
              <Link to="/pricing" className="landing-footerLink">Tarifs</Link>
              <Link to="/cgv" className="landing-footerLink">CGV</Link>
              <Link to="/mentions-legales" className="landing-footerLink">Mentions légales</Link>
              <a href="mailto:contact@offertrail.com" className="landing-footerLink">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
