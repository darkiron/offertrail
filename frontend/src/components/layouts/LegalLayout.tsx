import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../../config/legal';

const legalLayoutStyles = `
  /* ── Shell ── */
  .ll-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-base);
  }

  /* ── Nav ── */
  .ll-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: color-mix(in srgb, var(--bg-base) 80%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  }

  .ll-navInner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 32px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .ll-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--text-main);
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: -0.02em;
  }

  .ll-logoMark {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent-hover) 80%, white 20%) 100%);
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 900;
    color: white;
    flex-shrink: 0;
  }

  .ll-navRight {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ll-navLink {
    padding: 7px 16px;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-main);
    text-decoration: none;
    border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
    background: transparent;
    transition: background 0.15s;
  }

  .ll-navLink:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  /* ── Content ── */
  .ll-main {
    flex: 1;
  }

  .ll-content {
    max-width: 720px;
    margin: 0 auto;
    padding: 64px 32px 96px;
  }

  .ll-back {
    margin-bottom: 36px;
  }

  .ll-backLink {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.15s;
  }

  .ll-backLink:hover {
    color: var(--text-main);
  }

  .ll-pageTitle {
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    letter-spacing: -0.04em;
    margin: 0 0 6px;
    line-height: 1.1;
  }

  .ll-pageUpdated {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin: 0 0 48px;
  }

  /* ── Sections ── */
  .ll-section {
    margin-bottom: 36px;
  }

  .ll-section h2 {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
    margin: 0 0 12px;
  }

  .ll-section p,
  .ll-section address {
    color: var(--text-dim);
    font-size: 0.95rem;
    line-height: 1.75;
    margin: 0 0 10px;
    font-style: normal;
  }

  .ll-section p:last-child {
    margin-bottom: 0;
  }

  .ll-section a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .ll-divider {
    height: 1px;
    background: color-mix(in srgb, var(--border) 60%, transparent);
    margin: 0 0 36px;
  }

  /* ── Footer ── */
  .ll-footer {
    border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    background: color-mix(in srgb, var(--bg-crust) 40%, transparent);
  }

  .ll-footerInner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ll-footerCopy {
    font-size: 0.82rem;
    color: var(--text-dim);
  }

  .ll-footerLinks {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .ll-footerLink {
    font-size: 0.82rem;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.15s;
  }

  .ll-footerLink:hover {
    color: var(--text-main);
  }

  .ll-footerSep {
    color: color-mix(in srgb, var(--border) 80%, transparent);
    font-size: 0.82rem;
  }

  @media (max-width: 600px) {
    .ll-content { padding: 48px 20px 72px; }
    .ll-navInner { padding: 0 20px; }
    .ll-footerInner { flex-direction: column; align-items: flex-start; padding: 20px; }
  }
`;

interface LegalLayoutProps extends PropsWithChildren {
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <>
      <style>{legalLayoutStyles}</style>
      <div className="ll-root">

        <nav className="ll-nav">
          <div className="ll-navInner">
            <Link to="/" className="ll-logo">
              <span className="ll-logoMark">OT</span>
              {LEGAL_CONFIG.productName}
            </Link>
            <div className="ll-navRight">
              <Link to="/login" className="ll-navLink">Se connecter</Link>
            </div>
          </div>
        </nav>

        <main className="ll-main">
          <div className="ll-content">
            <div className="ll-back">
              <Link to="/" className="ll-backLink">
                ← Retour à l'accueil
              </Link>
            </div>
            <h1 className="ll-pageTitle">{title}</h1>
            <p className="ll-pageUpdated">Dernière mise à jour : {lastUpdated}</p>
            <div className="ll-divider" />
            {children}
          </div>
        </main>

        <footer className="ll-footer">
          <div className="ll-footerInner">
            <span className="ll-footerCopy">© {new Date().getFullYear()} {LEGAL_CONFIG.company.name} — {LEGAL_CONFIG.productName}</span>
            <div className="ll-footerLinks">
              <Link to="/cgv" className="ll-footerLink">CGV</Link>
              <span className="ll-footerSep">·</span>
              <Link to="/mentions-legales" className="ll-footerLink">Mentions légales</Link>
              <span className="ll-footerSep">·</span>
              <Link to="/rgpd" className="ll-footerLink">RGPD</Link>
              <span className="ll-footerSep">·</span>
              <a href={`mailto:${LEGAL_CONFIG.company.email}`} className="ll-footerLink">Contact</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
