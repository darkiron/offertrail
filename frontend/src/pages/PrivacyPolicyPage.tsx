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

export const PrivacyPolicyPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Politique de confidentialité — OfferTrail';
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
        <div className="legal-eyebrow">RGPD &amp; confidentialité</div>
        <h1 className="legal-title">Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : janvier 2026</p>

        <div className="legal-section">
          <h2>Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données est l'éditeur du service OfferTrail.<br />
            Contact : <a href="mailto:contact@offertrail.fr" style={{ color: '#38bdf8' }}>contact@offertrail.fr</a>
          </p>
        </div>

        <div className="legal-section">
          <h2>Données collectées</h2>
          <p>Dans le cadre de l'utilisation du service, les données suivantes sont susceptibles d'être collectées :</p>
          <ul>
            <li>Adresse e-mail et informations de profil (prénom, nom) lors de la création de compte</li>
            <li>Données relatives aux candidatures, entreprises et contacts que vous saisissez</li>
            <li>Données de connexion (adresse IP, logs d'accès) à des fins de sécurité</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>Finalités du traitement</h2>
          <p>Vos données sont traitées pour :</p>
          <ul>
            <li>Fournir et améliorer le service OfferTrail</li>
            <li>Gérer votre compte et votre abonnement</li>
            <li>Assurer la sécurité du service</li>
            <li>Répondre à vos demandes de support</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>Conservation des données</h2>
          <p>
            Vos données sont conservées pendant la durée de votre utilisation du service, et au maximum
            3 ans après la dernière activité sur votre compte. À la résiliation de votre compte,
            vos données personnelles sont supprimées dans un délai de 30 jours.
          </p>
        </div>

        <div className="legal-section">
          <h2>Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification</strong> — corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Pour exercer vos droits, contactez-nous à{' '}
            <a href="mailto:contact@offertrail.fr" style={{ color: '#38bdf8' }}>contact@offertrail.fr</a>.
            Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>cnil.fr</a>).
          </p>
        </div>

        <div className="legal-section">
          <h2>Cookies</h2>
          <p>
            OfferTrail utilise uniquement des cookies strictement nécessaires au fonctionnement du service
            (authentification, préférences de thème). Aucun cookie publicitaire ou analytique tiers n'est utilisé.
          </p>
        </div>

        <div className="legal-section">
          <h2>Transferts de données</h2>
          <p>
            Les données sont hébergées sur l'infrastructure Vercel (États-Unis), encadrée par des garanties appropriées
            au sens du RGPD (clauses contractuelles types). Aucune donnée n'est vendue ou cédée à des tiers.
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
