import React from 'react';
import { Link } from 'react-router-dom';

const pageStyles = `
  .legal-shell { min-height: 100vh; background: var(--bg-base); color: var(--text-main); }
  .legal-nav { position: sticky; top: 0; z-index: 100; backdrop-filter: blur(16px); background: color-mix(in srgb, var(--bg-base) 85%, transparent 15%); border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent 20%); padding: 14px 24px; }
  .legal-nav-inner { max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .legal-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; letter-spacing: .04em; text-decoration: none; color: var(--text-main); }
  .legal-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #38bdf8, #2563eb); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .legal-back { font-size: 13px; color: var(--text-dim); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--border) 70%, transparent); transition: color .15s, background .15s; }
  .legal-back:hover { color: var(--text-main); background: color-mix(in srgb, var(--bg-surface) 50%, transparent); }
  .legal-content { max-width: 800px; margin: 0 auto; padding: 56px 24px 80px; }
  .legal-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 12px; }
  .legal-title { font-size: clamp(26px, 4vw, 38px); font-weight: 900; letter-spacing: -.03em; margin-bottom: 8px; }
  .legal-updated { font-size: 13px; color: var(--text-dim); margin-bottom: 40px; }
  .legal-section { margin-bottom: 36px; padding: 24px 26px; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--border) 80%, transparent); background: var(--bg-mantle); }
  .legal-section h2 { font-size: 15px; font-weight: 800; margin-bottom: 14px; color: var(--text-main); }
  .legal-section p, .legal-section li { font-size: 14px; color: var(--text-dim); line-height: 1.75; }
  .legal-section ul { padding-left: 20px; margin-top: 8px; }
  .legal-section li { margin-bottom: 6px; }
  .legal-footer { border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent); background: color-mix(in srgb, var(--bg-crust) 80%, transparent); padding: 28px 24px; text-align: center; }
  .legal-footer-inner { max-width: 800px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px; font-size: 13px; color: var(--text-dim); }
  .legal-footer-inner a { color: var(--text-dim); text-decoration: none; transition: color .15s; }
  .legal-footer-inner a:hover { color: var(--text-main); }
`;

export const TermsPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Conditions générales de vente — OfferTrail';
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
        <div className="legal-eyebrow">Conditions commerciales</div>
        <h1 className="legal-title">Conditions Générales de Vente</h1>
        <p className="legal-updated">Dernière mise à jour : janvier 2026</p>

        <div className="legal-section">
          <h2>Article 1 — Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent l'accès et l'utilisation
            du service OfferTrail, un outil de suivi de candidatures accessible via le site web.
            Elles s'appliquent à tout abonnement souscrit par un utilisateur.
          </p>
        </div>

        <div className="legal-section">
          <h2>Article 2 — Description du service</h2>
          <p>
            OfferTrail propose un service SaaS de gestion de candidatures. Deux niveaux d'accès sont disponibles :
          </p>
          <ul>
            <li><strong>Plan Starter (gratuit)</strong> — accès limité en nombre de candidatures</li>
            <li><strong>Plan Pro (9,99 EUR / mois)</strong> — accès complet, candidatures illimitées</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>Article 3 — Tarification et facturation</h2>
          <p>
            Le Plan Pro est facturé <strong>9,99 EUR TTC par mois</strong>, sans engagement de durée minimum.
            Le renouvellement est automatique à chaque période mensuelle. Les prix s'entendent toutes taxes
            comprises pour les utilisateurs en France.
          </p>
        </div>

        <div className="legal-section">
          <h2>Article 4 — Résiliation</h2>
          <p>
            L'utilisateur peut résilier son abonnement à tout moment depuis son espace "Mon compte".
            La résiliation prend effet à la fin de la période mensuelle en cours. Aucun remboursement
            prorata temporis n'est effectué pour la période restante.
          </p>
        </div>

        <div className="legal-section">
          <h2>Article 5 — Droit de rétractation</h2>
          <p>
            Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation
            ne s'applique pas aux services pleinement exécutés avant la fin du délai de rétractation
            et dont l'exécution a commencé après accord préalable exprès du consommateur.
          </p>
        </div>

        <div className="legal-section">
          <h2>Article 6 — Obligations de l'utilisateur</h2>
          <p>L'utilisateur s'engage à :</p>
          <ul>
            <li>Fournir des informations exactes lors de l'inscription</li>
            <li>Ne pas utiliser le service à des fins illicites ou contraires aux présentes CGV</li>
            <li>Ne pas tenter de compromettre la sécurité du service</li>
            <li>Être l'unique utilisateur de son compte</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>Article 7 — Disponibilité du service</h2>
          <p>
            OfferTrail s'efforce d'assurer une disponibilité maximale du service, sans garantie de
            disponibilité permanente. Des interruptions peuvent survenir pour maintenance ou force majeure.
            Aucune compensation n'est due en cas d'indisponibilité ponctuelle.
          </p>
        </div>

        <div className="legal-section">
          <h2>Article 8 — Droit applicable et litiges</h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
            sera recherchée en priorité. À défaut, les tribunaux français seront compétents.
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
