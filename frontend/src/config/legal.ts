/**
 * legal.ts — Configuration des informations légales d'OfferTrail.
 *
 * Modifier ce fichier pour mettre à jour les mentions légales, CGV et RGPD
 * sur l'ensemble du site sans toucher aux composants.
 */

export const LEGAL_CONFIG = {
  /** Nom commercial affiché publiquement */
  productName: 'OfferTrail',

  /** Entité juridique éditrice */
  company: {
    name: 'CraftCodes',
    /** Adresse complète (lignes séparées) */
    address: ['À compléter', 'France'],
    /** SIRET / RCS — laisser vide si pas encore immatriculé */
    siret: '',
    /** Email de contact principal */
    email: 'contact@craftcodes.fr',
    /** Email dédié RGPD / DPO */
    emailRgpd: 'privacy@craftcodes.fr',
  },

  /** Hébergeur */
  hosting: {
    name: 'À compléter',
    address: '',
    url: '',
  },

  /** Date de dernière mise à jour des documents (ISO YYYY-MM-DD) */
  lastUpdated: '2025-04-06',

  /** Prix de l'abonnement Pro */
  pricing: {
    amount: '9,99€',
    period: 'mois',
    currency: 'EUR',
  },
} as const;

/** Helper : formatte la date de mise à jour en français */
export function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
