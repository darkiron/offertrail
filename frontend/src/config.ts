import { env } from '@shared/config/env';

export const CONFIG = {
  PRO_PRICE: '9,99€',
  PRO_PRICE_NUM: 9.99,
  FREE_LIMIT: 5,
  CONTACT_EMAIL: env.contactEmail,
  CRAFTCODES_URL: env.craftcodesUrl,
  PROMO_PLACEHOLDER: env.promoPlaceholder,
} as const;
