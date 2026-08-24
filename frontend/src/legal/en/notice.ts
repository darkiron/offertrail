import type { LegalSection } from '../types';

export const sections = [
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
] as const satisfies readonly LegalSection[];
