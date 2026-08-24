import type { LegalSection } from '../types';

export const sections = [
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
] as const satisfies readonly LegalSection[];
