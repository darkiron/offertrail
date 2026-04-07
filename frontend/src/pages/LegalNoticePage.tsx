import React from 'react';
import { Link } from 'react-router-dom';

const pageStyles = `
  .legal-shell {
    min-height: 100vh;
    background: var(--bg-base);
    color: var(--text-main);
  }

  .legal-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(16px);
    background: color-mix(in srgb, var(--bg-base) 85%, transparent 15%);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent 20%);
    padding: 14px 24px;
  }

  .legal-nav-inner {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .legal-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 17px;
    letter-spacing: .04em;
    text-decoration: none;
    color: var(--text-main);
  }

  .legal-brand-mark {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .legal-back {
    font-size: 13px;
    color: var(--text-dim);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    transition: color .15s, background .15s;
  }

  .legal-back:hover {
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-surface) 50%, transparent);
  }

  .legal-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 56px 24px 80px;
  }

  .legal-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 12px;
  }

  .legal-title {
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 900;
    letter-spacing: -.03em;
    margin-bottom: 8px;
  }

  .legal-updated {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 40px;
  }

  .legal-section {
    margin-bottom: 36px;
    padding: 24px 26px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    background: var(--bg-mantle);
  }

  .legal-section h2 {
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 14px;
    color: var(--text-main);
  }

  .legal-section p, .legal-section li {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.75;
  }

  .legal-section ul {
    padding-left: 20px;
    margin-top: 8px;
  }

  .legal-section li { margin-bottom: 6px; }

  .legal-footer {
    border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    background: color-mix(in srgb, var(--bg-crust) 80%, transparent);
    padding: 28px 24px;
    text-align: center;
  }

  .legal-footer-inner {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .legal-footer-inner a {
    color: var(--text-dim);
    text-decoration: none;
    transition: color .15s;
  }

  .legal-footer-inner a:hover { color: var(--text-main); }
`;

export const LegalNoticePage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Mentions légales — OfferTrail';
  }, []);

  return (
    <div className="legal-shell">
      <style>{pageStyles}</style>

      <div className="legal-nav">
        <div className="legal-nav-inner">
          <Link to="/" className="legal-brand">
            <div className="legal-brand-mark">OT</div>
            OfferTrail
          </Link>
          <Link to="/" className="legal-back">← Retour à l'accueil</Link>
        </div>
      </div>

      <main className="legal-content">
        <div className="legal-eyebrow">Informations légales</div>
        <h1 className="legal-title">Mentions légales</h1>
        <p className="legal-updated">Dernière mise à jour : janvier 2026</p>

        <div className="legal-section">
          <h2>Éditeur du site</h2>
          <p>
            OfferTrail est un service édité à titre personnel.<br />
            Responsable de publication : Vincent<br />
            Contact : <a href="mailto:contact@offertrail.fr" style={{ color: '#38bdf8' }}>contact@offertrail.fr</a>
          </p>
        </div>

        <div className="legal-section">
          <h2>Hébergement</h2>
          <p>
            Ce service est hébergé par :<br />
            <strong>Vercel Inc.</strong><br />
            340 Pine Street, Suite 900 — San Francisco, CA 94104, États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>vercel.com</a>
          </p>
        </div>

        <div className="legal-section">
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (structure, textes, code, design) est protégé par le droit d'auteur.
            Toute reproduction, même partielle, est interdite sans autorisation préalable écrite de l'éditeur.
          </p>
        </div>

        <div className="legal-section">
          <h2>Responsabilité</h2>
          <p>
            OfferTrail s'efforce d'assurer l'exactitude des informations présentes sur ce site. Toutefois,
            l'éditeur ne peut être tenu responsable des erreurs, omissions ou de l'indisponibilité du service.
            L'utilisation du service se fait sous la seule responsabilité de l'utilisateur.
          </p>
        </div>

        <div className="legal-section">
          <h2>Droit applicable</h2>
          <p>
            Le présent site est soumis au droit français. Tout litige relatif à son utilisation relève
            de la compétence exclusive des tribunaux français.
          </p>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <span>© {new Date().getFullYear()} OfferTrail</span>
          <Link to="/legal">Mentions légales</Link>
          <Link to="/cgv">CGV</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
};
