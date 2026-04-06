import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const cgvStyles = `
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

  .legal-section p {
    color: var(--text-dim);
    font-size: 0.95rem;
    line-height: 1.7;
    margin: 0 0 10px;
  }

  .legal-section p:last-child {
    margin-bottom: 0;
  }
`;

export function CGV() {
  useEffect(() => {
    document.title = 'Conditions Générales de Vente — OfferTrail';
  }, []);

  return (
    <>
      <style>{cgvStyles}</style>
      <div className="legal-shell">
        <div className="legal-back">
          <Link to="/" className="btn-ghost" style={{ borderRadius: 999, padding: '0.45rem 0.75rem', textDecoration: 'none' }}>
            ← Retour
          </Link>
        </div>

        <h1 className="legal-title">Conditions Générales de Vente</h1>
        <p className="legal-updated">Dernière mise à jour : avril 2025</p>

        <div className="legal-section">
          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent l'accès et l'utilisation du service
            OfferTrail, outil de suivi de candidatures destiné aux freelances et chercheurs d'emploi.
          </p>
        </div>

        <div className="legal-section">
          <h2>2. Offre et tarification</h2>
          <p>
            OfferTrail propose un abonnement mensuel au tarif de <strong>9,99€ TTC par mois</strong>,
            donnant accès à l'ensemble des fonctionnalités de la plateforme sans restriction.
          </p>
          <p>
            L'abonnement est sans engagement et peut être résilié à tout moment. La résiliation prend
            effet à la fin de la période mensuelle en cours.
          </p>
        </div>

        <div className="legal-section">
          <h2>3. Paiement</h2>
          <p>
            Le paiement est effectué mensuellement par carte bancaire via un prestataire de paiement sécurisé
            (Mollie, intégration prochaine). Les données bancaires ne sont jamais stockées sur nos serveurs.
          </p>
        </div>

        <div className="legal-section">
          <h2>4. Droit de rétractation</h2>
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne
            s'applique pas aux services numériques dont l'exécution a commencé avant l'expiration du
            délai de rétractation, avec l'accord exprès du consommateur.
          </p>
        </div>

        <div className="legal-section">
          <h2>5. Données et confidentialité</h2>
          <p>
            Les données de candidatures saisies restent la propriété exclusive de l'utilisateur.
            OfferTrail s'engage à ne pas exploiter, vendre ou transmettre ces données à des tiers.
            Pour toute question : <a href="mailto:contact@offertrail.com">contact@offertrail.com</a>.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Responsabilité</h2>
          <p>
            OfferTrail est fourni "en l'état". Nous ne saurions être tenus responsables d'une
            interruption de service, d'une perte de données ou de tout préjudice indirect lié à
            l'utilisation de la plateforme.
          </p>
        </div>

        <div className="legal-section">
          <h2>7. Droit applicable</h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, les parties
            s'engagent à rechercher une solution amiable avant tout recours judiciaire.
          </p>
        </div>
      </div>
    </>
  );
}
