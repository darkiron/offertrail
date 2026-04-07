import { useEffect } from 'react';
import { LegalLayout } from '../components/layouts/LegalLayout';
import { LEGAL_CONFIG, formatLastUpdated } from '../config/legal';

export function CGV() {
  useEffect(() => {
    document.title = `Conditions Générales de Vente — ${LEGAL_CONFIG.productName}`;
  }, []);

  const price = `${LEGAL_CONFIG.pricing.amount} TTC/${LEGAL_CONFIG.pricing.period}`;

  return (
    <LegalLayout title="Conditions Générales de Vente" lastUpdated={formatLastUpdated(LEGAL_CONFIG.lastUpdated)}>

      <div className="ll-section">
        <h2>1. Objet</h2>
        <p>
          Les présentes Conditions Générales de Vente (CGV) régissent la relation contractuelle entre {LEGAL_CONFIG.company.name} (ci-après « l'Éditeur ») et tout utilisateur souscrivant à l'abonnement {LEGAL_CONFIG.productName} (ci-après « l'Abonné »).
        </p>
      </div>

      <div className="ll-section">
        <h2>2. Éditeur</h2>
        <address>
          <strong>{LEGAL_CONFIG.company.name}</strong><br />
          {LEGAL_CONFIG.company.address.join(', ')}<br />
          {LEGAL_CONFIG.company.siret ? <>SIRET : {LEGAL_CONFIG.company.siret}<br /></> : null}
          E-mail : <a href={`mailto:${LEGAL_CONFIG.company.email}`}>{LEGAL_CONFIG.company.email}</a>
        </address>
      </div>

      <div className="ll-section">
        <h2>3. Description du service</h2>
        <p>
          {LEGAL_CONFIG.productName} est un outil de suivi de candidatures destiné aux freelances et chercheurs d'emploi. Il permet de gérer un pipeline de candidatures, des contacts, des entreprises et des relances depuis une interface centralisée.
        </p>
      </div>

      <div className="ll-section">
        <h2>4. Offre et tarification</h2>
        <p>
          {LEGAL_CONFIG.productName} est proposé sous la forme d'un abonnement mensuel au tarif de <strong>{price}</strong>, donnant accès à l'intégralité des fonctionnalités sans restriction.
        </p>
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises. L'Éditeur se réserve le droit de modifier ses tarifs à tout moment, avec un préavis de 30 jours notifié par e-mail.
        </p>
      </div>

      <div className="ll-section">
        <h2>5. Commande et paiement</h2>
        <p>
          L'abonnement prend effet dès validation du paiement. Le renouvellement est automatique chaque mois à la date anniversaire de souscription.
        </p>
        <p>
          Le paiement est sécurisé et traité par un prestataire certifié PCI-DSS. Les coordonnées bancaires ne sont jamais stockées sur les serveurs de l'Éditeur.
        </p>
      </div>

      <div className="ll-section">
        <h2>6. Résiliation</h2>
        <p>
          L'Abonné peut résilier son abonnement à tout moment depuis son espace compte. La résiliation prend effet à la fin de la période mensuelle en cours. Aucun remboursement proratisé n'est effectué pour la période entamée.
        </p>
        <p>
          L'Éditeur se réserve le droit de résilier un compte en cas de violation des présentes CGV, sans préavis ni remboursement.
        </p>
      </div>

      <div className="ll-section">
        <h2>7. Droit de rétractation</h2>
        <p>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux contenus numériques dont l'exécution a commencé, avec l'accord exprès du consommateur, avant l'expiration du délai de rétractation.
        </p>
        <p>
          En souscrivant à l'abonnement, l'Abonné reconnaît expressément renoncer à son droit de rétractation dès l'accès au service.
        </p>
      </div>

      <div className="ll-section">
        <h2>8. Données personnelles</h2>
        <p>
          Les données saisies dans {LEGAL_CONFIG.productName} restent la propriété exclusive de l'Abonné. L'Éditeur s'engage à ne pas les exploiter, céder ou revendre à des tiers.
        </p>
        <p>
          Pour toute question relative à la protection des données, consultez notre <a href="/rgpd">Politique de confidentialité & RGPD</a> ou contactez : <a href={`mailto:${LEGAL_CONFIG.company.emailRgpd}`}>{LEGAL_CONFIG.company.emailRgpd}</a>.
        </p>
      </div>

      <div className="ll-section">
        <h2>9. Responsabilité</h2>
        <p>
          Le service est fourni « en l'état ». L'Éditeur ne saurait être tenu responsable d'une interruption de service, d'une perte de données ou de tout préjudice indirect résultant de l'utilisation de {LEGAL_CONFIG.productName}.
        </p>
        <p>
          La responsabilité de l'Éditeur est limitée, en tout état de cause, au montant des sommes effectivement versées par l'Abonné au cours des 12 mois précédant le fait générateur.
        </p>
      </div>

      <div className="ll-section">
        <h2>10. Droit applicable et juridiction</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux compétents seront ceux du ressort du siège social de l'Éditeur.
        </p>
      </div>

    </LegalLayout>
  );
}
