import type { LegalSection } from '../types';

export const sections = [
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
    items: ['Access', 'Rectification', 'Erasure', 'Portability', 'Objection'],
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
] as const satisfies readonly LegalSection[];
