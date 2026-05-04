import React from 'react';
import { LegalLayout } from '../../components/LegalLayout';
import { useI18n } from '../../i18n';

export const CGU: React.FC = () => {
  const { t } = useI18n();
  React.useEffect(() => {
    document.title = t('legal.cgu') + ' — OfferTrail';
  }, [t]);

  return (
    <LegalLayout
      eyebrow={t('legal.eyebrowTerms')}
      title={t('legal.cgu')}
      updated={t('legal.updated')}
    >
      <div className="legal-section">
        <h2>Article 1 — Éditeur du service</h2>
        <p>
          OfferTrail est édité par <strong>CraftCodes</strong>.<br />
          Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 2 — Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
          du service OfferTrail, outil SaaS de suivi de candidatures. En créant un compte, l'utilisateur
          accepte sans réserve les présentes CGU.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 3 — Description du service</h2>
        <p>
          OfferTrail permet de gérer un pipeline de candidatures, de suivre les entreprises et contacts,
          de planifier des relances et de visualiser des statistiques de recherche d'emploi.
        </p>
        <p>
          Le service est accessible via un abonnement mensuel <strong>Plan Pro (14,99 EUR TTC / mois)</strong>.
          L'accès au service est conditionné à la souscription d'un abonnement actif.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 4 — Compte utilisateur</h2>
        <p>
          L'accès au service requiert la création d'un compte avec une adresse e-mail valide.
          L'utilisateur est seul responsable de la confidentialité de ses identifiants.
          Tout accès via le compte est réputé effectué par l'utilisateur titulaire.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 5 — Utilisation acceptable</h2>
        <p>L'utilisateur s'engage à :</p>
        <ul>
          <li>Utiliser le service à des fins personnelles et licites uniquement</li>
          <li>Ne pas tenter d'accéder aux données d'autres utilisateurs</li>
          <li>Ne pas compromettre la sécurité ou les performances du service</li>
          <li>Ne pas revendre ou redistribuer l'accès au service</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>Article 6 — Abonnement et résiliation</h2>
        <p>
          L'abonnement est à renouvellement automatique mensuel. L'utilisateur peut résilier
          à tout moment depuis "Mon compte". La résiliation prend effet à la fin de la période
          mensuelle en cours. <strong>Aucun remboursement prorata temporis n'est effectué.</strong>
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 7 — Données et hébergement</h2>
        <p>
          Les données utilisateur (authentification, profil) sont hébergées via{' '}
          <strong>Supabase</strong> sur des infrastructures situées dans l'Union européenne,
          conformément au RGPD.
        </p>
        <p>
          Les données saisies dans le service restent la propriété exclusive de l'utilisateur.
          CraftCodes s'engage à ne pas les exploiter, céder ou revendre à des tiers.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 8 — Disponibilité</h2>
        <p>
          CraftCodes s'efforce d'assurer une disponibilité maximale du service, sans garantie
          de continuité permanente. Des interruptions peuvent survenir pour maintenance ou cas
          de force majeure, sans compensation due.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 9 — Modification des CGU</h2>
        <p>
          CraftCodes se réserve le droit de modifier les présentes CGU à tout moment.
          Les utilisateurs sont informés par e-mail 30 jours avant l'entrée en vigueur
          des nouvelles conditions. L'utilisation continue du service vaut acceptation.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 10 — Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, une solution
          amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.
        </p>
      </div>
    </LegalLayout>
  );
};
