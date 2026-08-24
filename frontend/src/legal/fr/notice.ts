import type { LegalSection } from '../types';

export const sections = [
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
] as const satisfies readonly LegalSection[];
