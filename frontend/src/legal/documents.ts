import type { Locale } from '../i18n';

export type LegalDocumentId =
  'termsOfSale' | 'termsOfUse' | 'privacy' | 'legalNotice';

export interface LegalSection {
  heading: string;
  paragraphs?: readonly string[];
  subheading?: string;
  items?: readonly string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  version: string;
  pageTitle: string;
  eyebrow: string;
  title: string;
  updated: string;
  sections: readonly LegalSection[];
}

const fr = {
  termsOfSale: {
    id: 'termsOfSale',
    version: '2026-01',
    pageTitle: 'Conditions générales de vente — OfferTrail',
    eyebrow: 'Conditions commerciales',
    title: 'Conditions Générales de Vente',
    updated: 'Dernière mise à jour : janvier 2026',
    sections: [
      {
        heading: 'Article 1 — Objet',
        paragraphs: [
          'Les présentes CGV régissent les abonnements au service OfferTrail, édité par CraftCodes.',
        ],
      },
      {
        heading: 'Article 2 — Description du service',
        paragraphs: [
          'OfferTrail propose les plans Free, Pro et Ultimate. Les fonctionnalités et limites applicables sont indiquées sur la page Tarifs.',
        ],
      },
      {
        heading: 'Article 3 — Tarification et facturation',
        paragraphs: [
          'Les prix, taxes et périodes de facturation applicables sont ceux affichés au moment de la commande. Le renouvellement est automatique pour chaque période souscrite.',
        ],
      },
      {
        heading: 'Article 4 — Résiliation',
        paragraphs: [
          'L’utilisateur peut résilier son abonnement depuis Mon compte. La résiliation prend effet à la fin de la période en cours et n’entraîne aucun remboursement prorata temporis.',
        ],
      },
      {
        heading: 'Article 5 — Droit de rétractation',
        paragraphs: [
          'Conformément à l’article L.221-28 du Code de la consommation, l’exécution immédiate du service peut exclure le droit de rétractation après accord exprès de l’utilisateur.',
        ],
      },
      {
        heading: 'Article 6 — Obligations',
        paragraphs: ['L’utilisateur s’engage à :'],
        items: [
          'Fournir des informations exactes',
          'Utiliser le service à des fins licites',
          'Préserver la sécurité de son compte',
          'Ne pas redistribuer son accès',
        ],
      },
      {
        heading: 'Article 7 — Disponibilité',
        paragraphs: [
          'CraftCodes s’efforce d’assurer la disponibilité du service. Des interruptions peuvent survenir pour maintenance ou force majeure.',
        ],
      },
      {
        heading: 'Article 8 — Droit applicable',
        paragraphs: [
          'Les présentes CGV sont soumises au droit français. Une solution amiable sera recherchée avant toute action contentieuse.',
        ],
      },
    ],
  },
  termsOfUse: {
    id: 'termsOfUse',
    version: '2026-01',
    pageTitle: 'Conditions Générales d’Utilisation — OfferTrail',
    eyebrow: 'Conditions d’utilisation',
    title: 'Conditions Générales d’Utilisation',
    updated: 'Dernière mise à jour : janvier 2026',
    sections: [
      {
        heading: 'Article 1 — Éditeur',
        paragraphs: [
          'OfferTrail est édité par CraftCodes. Contact : contact@craftcodes.fr.',
        ],
      },
      {
        heading: 'Article 2 — Objet',
        paragraphs: [
          'Ces CGU régissent l’accès et l’utilisation du service OfferTrail. La création d’un compte emporte leur acceptation.',
        ],
      },
      {
        heading: 'Article 3 — Service',
        paragraphs: [
          'OfferTrail permet de suivre candidatures, entreprises, contacts, relances et statistiques de recherche d’emploi.',
        ],
      },
      {
        heading: 'Article 4 — Compte',
        paragraphs: [
          'Une adresse e-mail valide est requise. L’utilisateur est responsable de la confidentialité de ses identifiants.',
        ],
      },
      {
        heading: 'Article 5 — Utilisation acceptable',
        items: [
          'Utiliser le service à des fins personnelles et licites',
          'Ne pas accéder aux données d’autres utilisateurs',
          'Ne pas compromettre la sécurité ou les performances',
          'Ne pas revendre l’accès au service',
        ],
      },
      {
        heading: 'Article 6 — Abonnement et résiliation',
        paragraphs: [
          'Les abonnements payants sont renouvelés selon la période choisie. La résiliation depuis Mon compte prend effet à la fin de la période en cours.',
        ],
      },
      {
        heading: 'Article 7 — Données et sous-traitants',
        paragraphs: [
          'Les données applicatives et l’authentification reposent sur Supabase ; le paiement est traité par Stripe ; l’API est déployée sur Render et le frontend sur Vercel. Les régions effectives dépendent de la configuration de chaque service.',
        ],
      },
      {
        heading: 'Article 8 — Disponibilité',
        paragraphs: [
          'CraftCodes s’efforce d’assurer une disponibilité maximale sans garantie de continuité permanente.',
        ],
      },
      {
        heading: 'Article 9 — Modification',
        paragraphs: [
          'Les utilisateurs sont informés avant l’entrée en vigueur de changements substantiels.',
        ],
      },
      {
        heading: 'Article 10 — Droit applicable',
        paragraphs: ['Les présentes CGU sont soumises au droit français.'],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    version: '2026-08',
    pageTitle: 'Politique de confidentialité — OfferTrail',
    eyebrow: 'RGPD & confidentialité',
    title: 'Politique de confidentialité',
    updated: 'Dernière mise à jour : août 2026',
    sections: [
      {
        heading: 'Responsable du traitement',
        paragraphs: [
          'CraftCodes est responsable du traitement des données personnelles. Contact RGPD : contact@craftcodes.fr.',
        ],
      },
      {
        heading: 'Données collectées',
        items: [
          'Adresse e-mail et informations de profil',
          'Candidatures, entreprises et contacts saisis',
          'Données techniques nécessaires à la sécurité',
          'Informations de transaction traitées par Stripe et non stockées par CraftCodes',
        ],
      },
      {
        heading: 'Finalités',
        items: [
          'Fournir et améliorer OfferTrail',
          'Gérer le compte et l’abonnement',
          'Sécuriser le service et prévenir les abus',
          'Répondre aux demandes de support',
        ],
      },
      {
        heading: 'Sous-traitants et hébergement',
        paragraphs: [
          'Le frontend est déployé sur Vercel, l’API sur Render, et les données applicatives ainsi que l’authentification reposent sur Supabase. Stripe traite les paiements. Les régions et transferts effectifs dépendent de la configuration contractuelle de ces services et sont encadrés par les garanties applicables.',
        ],
      },
      {
        heading: 'Conservation',
        paragraphs: [
          'Les données sont conservées pendant la durée nécessaire au service et aux obligations légales. Les demandes de suppression sont traitées dans les délais applicables.',
        ],
      },
      {
        heading: 'Vos droits',
        items: [
          'Droit d’accès',
          'Droit de rectification',
          'Droit à l’effacement',
          'Droit à la portabilité',
          'Droit d’opposition',
        ],
      },
      {
        heading: 'Exercer vos droits',
        paragraphs: [
          'Contactez contact@craftcodes.fr. Vous pouvez également introduire une réclamation auprès de la CNIL.',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'OfferTrail utilise uniquement les mécanismes de stockage strictement nécessaires au fonctionnement et aux préférences du service.',
        ],
      },
    ],
  },
  legalNotice: {
    id: 'legalNotice',
    version: '2026-08',
    pageTitle: 'Mentions légales — OfferTrail',
    eyebrow: 'Informations légales',
    title: 'Mentions légales',
    updated: 'Dernière mise à jour : août 2026',
    sections: [
      {
        heading: 'Éditeur',
        paragraphs: [
          'OfferTrail est édité par CraftCodes. Responsable de publication : Vincent. Contact : contact@craftcodes.fr.',
        ],
      },
      {
        heading: 'Hébergement',
        paragraphs: [
          'Le frontend OfferTrail est hébergé par Vercel Inc. et son API par Render Services, Inc. Les données applicatives et l’authentification reposent sur Supabase.',
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        paragraphs: [
          'La structure, les textes, le code et le design sont protégés par le droit d’auteur. Toute reproduction nécessite une autorisation préalable.',
        ],
      },
      {
        heading: 'Responsabilité',
        paragraphs: [
          'CraftCodes s’efforce d’assurer l’exactitude des informations et la disponibilité du service, sans pouvoir garantir l’absence d’erreur ou d’interruption.',
        ],
      },
      {
        heading: 'Droit applicable',
        paragraphs: ['Le site est soumis au droit français.'],
      },
    ],
  },
} as const satisfies Record<LegalDocumentId, LegalDocument>;

const en: Record<LegalDocumentId, LegalDocument> = {
  termsOfSale: {
    ...fr.termsOfSale,
    pageTitle: 'Terms of Sale — OfferTrail',
    eyebrow: 'Commercial terms',
    title: 'Terms of Sale',
    updated: 'Last updated: January 2026',
    sections: [
      {
        heading: 'Article 1 — Purpose',
        paragraphs: [
          'These Terms of Sale govern subscriptions to OfferTrail, published by CraftCodes.',
        ],
      },
      {
        heading: 'Article 2 — Service',
        paragraphs: [
          'OfferTrail offers Free, Pro and Ultimate plans. Current features and limits are shown on the Pricing page.',
        ],
      },
      {
        heading: 'Article 3 — Pricing and billing',
        paragraphs: [
          'Prices, taxes and billing periods are those displayed when ordering. Subscriptions renew automatically for the selected period.',
        ],
      },
      {
        heading: 'Article 4 — Cancellation',
        paragraphs: [
          'Users may cancel from My account. Cancellation takes effect at the end of the current period without a pro-rata refund.',
        ],
      },
      {
        heading: 'Article 5 — Withdrawal',
        paragraphs: [
          'Under Article L.221-28 of the French Consumer Code, immediate performance may exclude withdrawal after the user’s express consent.',
        ],
      },
      {
        heading: 'Article 6 — Obligations',
        paragraphs: ['Users agree to:'],
        items: [
          'Provide accurate information',
          'Use the service lawfully',
          'Keep their account secure',
          'Not redistribute access',
        ],
      },
      {
        heading: 'Article 7 — Availability',
        paragraphs: [
          'CraftCodes aims to keep the service available. Maintenance and force majeure may cause interruptions.',
        ],
      },
      {
        heading: 'Article 8 — Governing law',
        paragraphs: [
          'These Terms are governed by French law. An amicable solution will be sought before litigation.',
        ],
      },
    ],
  },
  termsOfUse: {
    ...fr.termsOfUse,
    pageTitle: 'Terms of Use — OfferTrail',
    eyebrow: 'Terms of use',
    title: 'Terms of Use',
    updated: 'Last updated: January 2026',
    sections: [
      {
        heading: 'Article 1 — Publisher',
        paragraphs: [
          'OfferTrail is published by CraftCodes. Contact: contact@craftcodes.fr.',
        ],
      },
      {
        heading: 'Article 2 — Purpose',
        paragraphs: [
          'These Terms govern access to and use of OfferTrail. Creating an account constitutes acceptance.',
        ],
      },
      {
        heading: 'Article 3 — Service',
        paragraphs: [
          'OfferTrail tracks applications, companies, contacts, follow-ups and job-search statistics.',
        ],
      },
      {
        heading: 'Article 4 — Account',
        paragraphs: [
          'A valid email is required. Users are responsible for keeping their credentials confidential.',
        ],
      },
      {
        heading: 'Article 5 — Acceptable use',
        items: [
          'Use the service lawfully',
          'Do not access other users’ data',
          'Do not compromise security or performance',
          'Do not resell access',
        ],
      },
      {
        heading: 'Article 6 — Subscription',
        paragraphs: [
          'Paid subscriptions renew for the selected period. Cancellation takes effect at the end of the current period.',
        ],
      },
      {
        heading: 'Article 7 — Data and processors',
        paragraphs: [
          'Application data and authentication use Supabase; Stripe processes payments; the API is deployed on Render and the frontend on Vercel. Effective regions depend on each service configuration.',
        ],
      },
      {
        heading: 'Article 8 — Availability',
        paragraphs: [
          'CraftCodes aims for high availability without guaranteeing uninterrupted service.',
        ],
      },
      {
        heading: 'Article 9 — Changes',
        paragraphs: ['Users are informed before material changes take effect.'],
      },
      {
        heading: 'Article 10 — Governing law',
        paragraphs: ['These Terms are governed by French law.'],
      },
    ],
  },
  privacy: {
    ...fr.privacy,
    pageTitle: 'Privacy Policy — OfferTrail',
    eyebrow: 'GDPR & privacy',
    title: 'Privacy Policy',
    updated: 'Last updated: August 2026',
    sections: [
      {
        heading: 'Data controller',
        paragraphs: [
          'CraftCodes is the data controller. Privacy contact: contact@craftcodes.fr.',
        ],
      },
      {
        heading: 'Data collected',
        items: [
          'Email and profile information',
          'Applications, companies and contacts entered by users',
          'Technical security data',
          'Transaction information processed by Stripe and not stored by CraftCodes',
        ],
      },
      {
        heading: 'Purposes',
        items: [
          'Provide and improve OfferTrail',
          'Manage accounts and subscriptions',
          'Secure the service and prevent abuse',
          'Answer support requests',
        ],
      },
      {
        heading: 'Processors and hosting',
        paragraphs: [
          'The frontend is deployed on Vercel, the API on Render, and application data and authentication use Supabase. Stripe processes payments. Effective regions and transfers depend on each service’s contractual configuration and applicable safeguards.',
        ],
      },
      {
        heading: 'Retention',
        paragraphs: [
          'Data is retained as necessary to provide the service and meet legal obligations. Deletion requests are processed within applicable deadlines.',
        ],
      },
      {
        heading: 'Your rights',
        items: [
          'Access',
          'Rectification',
          'Erasure',
          'Portability',
          'Objection',
        ],
      },
      {
        heading: 'Exercise your rights',
        paragraphs: [
          'Contact contact@craftcodes.fr. You may also lodge a complaint with your data protection authority.',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'OfferTrail only uses storage mechanisms strictly necessary for the service and user preferences.',
        ],
      },
    ],
  },
  legalNotice: {
    ...fr.legalNotice,
    pageTitle: 'Legal Notice — OfferTrail',
    eyebrow: 'Legal information',
    title: 'Legal Notice',
    updated: 'Last updated: August 2026',
    sections: [
      {
        heading: 'Publisher',
        paragraphs: [
          'OfferTrail is published by CraftCodes. Publication manager: Vincent. Contact: contact@craftcodes.fr.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          'The OfferTrail frontend is hosted by Vercel Inc. and its API by Render Services, Inc. Application data and authentication use Supabase.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'The structure, text, code and design are protected by copyright. Reproduction requires prior permission.',
        ],
      },
      {
        heading: 'Liability',
        paragraphs: [
          'CraftCodes aims to ensure accurate information and service availability, without guaranteeing the absence of errors or interruptions.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: ['The site is governed by French law.'],
      },
    ],
  },
};

export const legalDocuments: Record<
  Locale,
  Record<LegalDocumentId, LegalDocument>
> = { fr, en };
