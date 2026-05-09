import React from 'react';
import { LegalLayout } from '../../components/LegalLayout';
import { useI18n } from '../../i18n';

const FR = { pageTitle: 'Politique de confidentialité — OfferTrail', eyebrow: 'RGPD & confidentialité', title: 'Politique de confidentialité', updated: 'Dernière mise à jour : janvier 2026' };
const EN = { pageTitle: 'Privacy Policy — OfferTrail', eyebrow: 'GDPR & privacy', title: 'Privacy Policy', updated: 'Last updated: January 2026' };

export const Confidentialite: React.FC = () => {
  const { locale } = useI18n();
  const c = locale === 'en' ? EN : FR;
  React.useEffect(() => { document.title = c.pageTitle; }, [c.pageTitle]);
  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} updated={c.updated}>
      {locale === 'en' ? <ConfidEN /> : <ConfidFR />}
    </LegalLayout>
  );
};

const ConfidFR: React.FC = () => (
  <>
    <div className="legal-section"><h2>Responsable du traitement</h2><p>Le responsable du traitement des données personnelles est <strong>CraftCodes</strong>, éditeur du service OfferTrail.<br />Contact RGPD : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a></p></div>
    <div className="legal-section"><h2>Hébergement des données</h2><p>Les données d'authentification et de profil sont hébergées via <strong>Supabase</strong>, dont les serveurs sont situés dans l'<strong>Union européenne</strong>, conformément aux exigences du RGPD. Aucune donnée personnelle n'est transférée en dehors de l'UE sans garanties appropriées.</p></div>
    <div className="legal-section"><h2>Données collectées</h2><p>Dans le cadre de l'utilisation du service, les données suivantes peuvent être collectées :</p><ul><li>Adresse e-mail, prénom et nom lors de la création de compte</li><li>Données relatives aux candidatures, entreprises et contacts saisis par l'utilisateur</li><li>Données techniques de connexion (adresse IP, logs d'accès) à des fins de sécurité</li><li>Informations de paiement traitées par Stripe (non stockées par CraftCodes)</li></ul></div>
    <div className="legal-section"><h2>Finalités du traitement</h2><p>Vos données sont traitées pour :</p><ul><li>Fournir et améliorer le service OfferTrail</li><li>Gérer votre compte et votre abonnement</li><li>Assurer la sécurité et prévenir les abus</li><li>Répondre à vos demandes de support</li></ul><p>Aucune donnée n'est utilisée à des fins publicitaires ou de profilage commercial.</p></div>
    <div className="legal-section"><h2>Conservation des données</h2><p>Vos données sont conservées pendant la durée active de votre compte, et au maximum 3 ans après la dernière activité. À la résiliation ou suppression du compte, les données personnelles sont supprimées dans un délai de 30 jours.</p></div>
    <div className="legal-section"><h2>Vos droits (RGPD)</h2><p>Conformément au RGPD, vous disposez des droits suivants :</p><ul><li><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles</li><li><strong>Droit de rectification</strong> — corriger vos données inexactes</li><li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li><li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li><li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li></ul><p>Pour exercer vos droits, contactez-nous à <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>. Vous disposez également du droit d'introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">CNIL</a>.</p></div>
    <div className="legal-section"><h2>Cookies</h2><p>OfferTrail utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, préférences de thème). Aucun cookie publicitaire ou analytique tiers n'est utilisé.</p></div>
    <div className="legal-section"><h2>Paiement</h2><p>Les paiements sont traités par <strong>Stripe</strong>, certifié PCI-DSS. CraftCodes ne stocke jamais vos coordonnées bancaires.</p></div>
  </>
);

const ConfidEN: React.FC = () => (
  <>
    <div className="legal-section"><h2>Data controller</h2><p>The data controller is <strong>CraftCodes</strong>, publisher of the OfferTrail service.<br />GDPR contact: <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a></p></div>
    <div className="legal-section"><h2>Data hosting</h2><p>Authentication and profile data is hosted via <strong>Supabase</strong>, whose servers are located in the <strong>European Union</strong>, in compliance with GDPR requirements. No personal data is transferred outside the EU without appropriate safeguards.</p></div>
    <div className="legal-section"><h2>Data collected</h2><p>In the course of using the service, the following data may be collected:</p><ul><li>Email address, first name and last name at account creation</li><li>Data relating to applications, companies and contacts entered by the user</li><li>Technical connection data (IP address, access logs) for security purposes</li><li>Payment information processed by Stripe (not stored by CraftCodes)</li></ul></div>
    <div className="legal-section"><h2>Purposes of processing</h2><p>Your data is processed to:</p><ul><li>Provide and improve the OfferTrail service</li><li>Manage your account and subscription</li><li>Ensure security and prevent abuse</li><li>Respond to your support requests</li></ul><p>No data is used for advertising or commercial profiling purposes.</p></div>
    <div className="legal-section"><h2>Data retention</h2><p>Your data is retained for the duration of your active account, and for a maximum of 3 years after the last activity. Upon cancellation or account deletion, personal data is deleted within 30 days.</p></div>
    <div className="legal-section"><h2>Your rights (GDPR)</h2><p>Under the GDPR, you have the following rights:</p><ul><li><strong>Right of access</strong> — obtain a copy of your personal data</li><li><strong>Right of rectification</strong> — correct inaccurate data</li><li><strong>Right to erasure</strong> — request deletion of your data</li><li><strong>Right to data portability</strong> — receive your data in a structured format</li><li><strong>Right to object</strong> — object to certain processing</li></ul><p>To exercise your rights, contact us at <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>. You also have the right to lodge a complaint with your national data protection authority.</p></div>
    <div className="legal-section"><h2>Cookies</h2><p>OfferTrail uses only strictly necessary cookies for the service to function (authentication, theme preferences). No third-party advertising or analytics cookies are used.</p></div>
    <div className="legal-section"><h2>Payment</h2><p>Payments are processed by <strong>Stripe</strong>, PCI-DSS certified. CraftCodes never stores your payment card details.</p></div>
  </>
);
