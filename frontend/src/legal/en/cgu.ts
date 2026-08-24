import type { LegalSection } from '../types';

export const sections = [
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
] as const satisfies readonly LegalSection[];
