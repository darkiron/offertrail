import type { LegalSection } from '../types';

export const sections = [
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
] as const satisfies readonly LegalSection[];
