import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/legal.css';

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}

const FooterLinks: React.FC = () => (
  <footer className="legal-footer">
    <div className="legal-footer-inner">
      <span>© {new Date().getFullYear()} OfferTrail</span>
      <span className="legal-footer-sep">·</span>
      <Link to="/legal">Mentions légales</Link>
      <span className="legal-footer-sep">·</span>
      <Link to="/cgv">CGV</Link>
      <span className="legal-footer-sep">·</span>
      <Link to="/confidentialite">Politique de confidentialité</Link>
      <span className="legal-footer-sep">·</span>
      <Link to="/contact">Contact</Link>
    </div>
  </footer>
);

export const LegalLayout: React.FC<LegalLayoutProps> = ({ eyebrow, title, updated, children }) => (
  <div className="legal-shell">
    <div className="legal-nav-wrap">
      <div className="legal-nav-inner">
        <Link to="/" className="legal-brand">
          <div className="legal-brand-mark">OT</div>
          OfferTrail
        </Link>
        <Link to="/" className="legal-back">← Retour à l'accueil</Link>
      </div>
    </div>

    <main className="legal-content">
      <div className="legal-eyebrow">{eyebrow}</div>
      <h1 className="legal-title">{title}</h1>
      {updated ? <p className="legal-updated">{updated}</p> : null}
      {children}
    </main>

    <FooterLinks />
  </div>
);
