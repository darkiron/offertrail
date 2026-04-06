import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const legalStyles = `
  .legal-shell {
    max-width: 720px;
    margin: 0 auto;
    padding: 64px 24px 80px;
  }

  .legal-back {
    margin-bottom: 32px;
  }

  .legal-title {
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    letter-spacing: -0.03em;
    margin: 0 0 8px;
  }

  .legal-updated {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin: 0 0 40px;
  }

  .legal-section {
    margin-bottom: 32px;
  }

  .legal-section h2 {
    font-size: 1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    margin: 0 0 10px;
  }

  .legal-section p, .legal-section address {
    color: var(--text-dim);
    font-size: 0.95rem;
    line-height: 1.7;
    margin: 0;
    font-style: normal;
  }
`;

export function MentionsLegales() {
  useEffect(() => {
    document.title = 'Mentions légales — OfferTrail';
  }, []);

  return (
    <>
      <style>{legalStyles}</style>
      <div className="legal-shell">
        <div className="legal-back">
          <Link to="/" className="btn-ghost" style={{ borderRadius: 999, padding: '0.45rem 0.75rem', textDecoration: 'none' }}>
            ← Retour
          </Link>
        </div>

        <h1 className="legal-title">Mentions légales</h1>
        <p className="legal-updated">Dernière mise à jour : avril 2025</p>

        <div className="legal-section">
          <h2>Éditeur du site</h2>
          <address>
            OfferTrail<br />
            Projet indépendant en cours de structuration juridique.<br />
            Contact : <a href="mailto:contact@offertrail.com">contact@offertrail.com</a>
          </address>
        </div>

        <div className="legal-section">
          <h2>Hébergement</h2>
          <p>
            L'application est actuellement hébergée localement ou sur infrastructure cloud privée.
            Les données ne sont pas transmises à des tiers.
          </p>
        </div>

        <div className="legal-section">
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus présents sur OfferTrail (textes, interface, code) sont la propriété
            exclusive de leurs auteurs. Toute reproduction ou diffusion sans autorisation est interdite.
          </p>
        </div>

        <div className="legal-section">
          <h2>Données personnelles</h2>
          <p>
            Les données saisies dans OfferTrail (candidatures, contacts, notes) sont stockées localement
            sur votre appareil ou sur votre instance dédiée. Elles ne sont pas partagées avec des tiers.
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression
            de vos données en contactant : <a href="mailto:contact@offertrail.com">contact@offertrail.com</a>.
          </p>
        </div>

        <div className="legal-section">
          <h2>Cookies</h2>
          <p>
            OfferTrail n'utilise pas de cookies de traçage ou de ciblage publicitaire.
            Un cookie de session est utilisé pour maintenir votre connexion.
          </p>
        </div>
      </div>
    </>
  );
}
