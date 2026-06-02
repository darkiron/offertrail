export const CONFIG = {
  PRO_PRICE: "9,99€",
  PRO_PRICE_NUM: 9.99,
  FREE_LIMIT: 5,
  CONTACT_EMAIL: import.meta.env.VITE_CONTACT_EMAIL as string,
  CRAFTCODES_URL: import.meta.env.VITE_CRAFTCODES_URL as string,
} as const;
