import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { useI18n } from '../i18n';

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useI18n();
  React.useEffect(() => {
    document.title = t('legal.privacy') + ' — OfferTrail';
  }, [t]);

  return (
    <LegalLayout
      eyebrow={t('legal.eyebrowPrivacy')}
      title={t('legal.privacy')}
      updated={t('legal.updated')}
    >
      <div className="legal-section">
        <h2>Responsable du traitement</h2>
        <p>
          Le responsable du traitement est l'éditeur du service OfferTrail.<br />
          Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>Données collectées</h2>
        <p>Dans le cadre de l'utilisation du service, les données suivantes peuvent être collectées :</p>
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
          3 ans après la dernière activité sur votre compte. À la résiliation, vos données personnelles
          sont supprimées dans un délai de 30 jours.
        </p>
      </div>

      <div className="legal-section">
        <h2>Vos droits (RGPD)</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> — corriger vos données inexactes</li>
          <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous à{' '}
          <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>.
          Vous disposez également du droit d'introduire une réclamation auprès de la{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">CNIL</a>.
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
          Les données sont hébergées sur l'infrastructure Vercel (États-Unis), encadrée par des garanties
          appropriées au sens du RGPD (clauses contractuelles types). Aucune donnée n'est vendue ou cédée à des tiers.
        </p>
      </div>
    </LegalLayout>
  );
};
