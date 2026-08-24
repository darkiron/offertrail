import type { LegalSection } from '../types';

export const sections = [
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
] as const satisfies readonly LegalSection[];
