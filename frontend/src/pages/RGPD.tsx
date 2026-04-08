import { useEffect } from 'react';
import { LegalLayout } from '../components/layouts/LegalLayout';
import { LEGAL_CONFIG, formatLastUpdated } from '../config/legal';

export function RGPD() {
  useEffect(() => {
    document.title = `Politique de confidentialité — ${LEGAL_CONFIG.productName}`;
  }, []);

  return (
    <LegalLayout title="Politique de confidentialité & RGPD" lastUpdated={formatLastUpdated(LEGAL_CONFIG.lastUpdated)}>

      <div className="ll-section">
        <h2>1. Responsable du traitement</h2>
        <address>
          {LEGAL_CONFIG.company.name}<br />
          {LEGAL_CONFIG.company.address.join(', ')}<br />
          {LEGAL_CONFIG.company.siret ? <>SIRET : {LEGAL_CONFIG.company.siret}<br /></> : null}
          Contact DPO : <a href={`mailto:${LEGAL_CONFIG.company.emailRgpd}`}>{LEGAL_CONFIG.company.emailRgpd}</a>
        </address>
      </div>

      <div className="ll-section">
        <h2>2. Données collectées</h2>
        <p>
          Dans le cadre de l'utilisation de {LEGAL_CONFIG.productName}, nous collectons les données suivantes :
        </p>
        <p>
          <strong>Données de compte :</strong> adresse e-mail, prénom, nom. Ces données sont nécessaires à la création et à la gestion de votre compte.
        </p>
        <p>
          <strong>Données d'usage :</strong> candidatures, contacts, entreprises, notes et statuts que vous saisissez dans l'application. Ces données vous appartiennent exclusivement.
        </p>
        <p>
          <strong>Données techniques :</strong> adresse IP (anonymisée), type de navigateur, logs d'accès. Utilisées uniquement à des fins de sécurité et de diagnostic.
        </p>
      </div>

      <div className="ll-section">
        <h2>3. Finalités et bases légales</h2>
        <p>
          <strong>Exécution du contrat (art. 6.1.b RGPD) :</strong> création et gestion du compte, fourniture du service, traitement des paiements.
        </p>
        <p>
          <strong>Intérêt légitime (art. 6.1.f RGPD) :</strong> sécurité de la plateforme, prévention des fraudes, amélioration du service.
        </p>
        <p>
          <strong>Obligation légale (art. 6.1.c RGPD) :</strong> conservation des données de facturation pendant 10 ans conformément au Code de commerce.
        </p>
      </div>

      <div className="ll-section">
        <h2>4. Durée de conservation</h2>
        <p>
          Les données de compte sont conservées pendant toute la durée de l'abonnement actif, puis pendant 3 ans après la dernière utilisation, sauf obligation légale contraire.
        </p>
        <p>
          Les données de facturation sont conservées 10 ans conformément aux obligations comptables légales.
        </p>
        <p>
          Vous pouvez demander la suppression de votre compte et de vos données à tout moment via <a href={`mailto:${LEGAL_CONFIG.company.emailRgpd}`}>{LEGAL_CONFIG.company.emailRgpd}</a>.
        </p>
      </div>

      <div className="ll-section">
        <h2>5. Partage des données</h2>
        <p>
          Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.
        </p>
        <p>
          Nous pouvons faire appel à des sous-traitants techniques (hébergement, paiement) qui traitent les données en notre nom et sont liés par des garanties contractuelles conformes au RGPD.
        </p>
        <p>
          Aucun transfert de données hors de l'Union Européenne n'est effectué sans garanties appropriées (clauses contractuelles types ou décision d'adéquation).
        </p>
      </div>

      <div className="ll-section">
        <h2>6. Cookies</h2>
        <p>
          {LEGAL_CONFIG.productName} utilise uniquement un cookie de session strictement nécessaire au maintien de votre connexion. Aucun cookie publicitaire, analytique tiers ou de traçage n'est déposé sur votre terminal.
        </p>
      </div>

      <div className="ll-section">
        <h2>7. Vos droits</h2>
        <p>
          Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants sur vos données personnelles :
        </p>
        <p>
          <strong>Droit d'accès</strong> — obtenir une copie des données vous concernant.<br />
          <strong>Droit de rectification</strong> — corriger des données inexactes ou incomplètes.<br />
          <strong>Droit à l'effacement</strong> — demander la suppression de vos données.<br />
          <strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine.<br />
          <strong>Droit d'opposition</strong> — vous opposer à un traitement fondé sur l'intérêt légitime.<br />
          <strong>Droit à la limitation</strong> — restreindre temporairement le traitement de vos données.
        </p>
        <p>
          Pour exercer vos droits, contactez notre DPO : <a href={`mailto:${LEGAL_CONFIG.company.emailRgpd}`}>{LEGAL_CONFIG.company.emailRgpd}</a>.
          Nous répondrons dans un délai d'un mois (prolongeable à 3 mois pour les demandes complexes).
        </p>
        <p>
          Vous avez également le droit d'introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
        </p>
      </div>

      <div className="ll-section">
        <h2>8. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des mots de passe (hashing bcrypt), HTTPS, accès restreint aux données, journalisation des accès.
        </p>
      </div>

      <div className="ll-section">
        <h2>9. Modifications de cette politique</h2>
        <p>
          En cas de modification substantielle de cette politique, vous serez informé par e-mail ou via une notification dans l'application au moins 30 jours avant l'entrée en vigueur des changements.
        </p>
        <p>
          Pour toute question : <a href={`mailto:${LEGAL_CONFIG.company.emailRgpd}`}>{LEGAL_CONFIG.company.emailRgpd}</a>
        </p>
      </div>

    </LegalLayout>
  );
}
