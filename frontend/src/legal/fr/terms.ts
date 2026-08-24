import type { LegalSection } from '../types';

export const sections = [
  {
    heading: 'Article 1 — Objet',
    paragraphs: [
      'Les présentes CGV régissent les abonnements au service OfferTrail, édité par CraftCodes.',
    ],
  },
  {
    heading: 'Article 2 — Description du service',
    paragraphs: [
      'OfferTrail propose les plans Free, Pro et Ultimate. Les fonctionnalités et limites applicables sont indiquées sur la page Tarifs.',
    ],
  },
  {
    heading: 'Article 3 — Tarification et facturation',
    paragraphs: [
      'Les prix, taxes et périodes de facturation applicables sont ceux affichés au moment de la commande. Le renouvellement est automatique pour chaque période souscrite.',
    ],
  },
  {
    heading: 'Article 4 — Résiliation',
    paragraphs: [
      'L’utilisateur peut résilier son abonnement depuis Mon compte. La résiliation prend effet à la fin de la période en cours et n’entraîne aucun remboursement prorata temporis.',
    ],
  },
  {
    heading: 'Article 5 — Droit de rétractation',
    paragraphs: [
      'Conformément à l’article L.221-28 du Code de la consommation, l’exécution immédiate du service peut exclure le droit de rétractation après accord exprès de l’utilisateur.',
    ],
  },
  {
    heading: 'Article 6 — Obligations',
    paragraphs: ['L’utilisateur s’engage à :'],
    items: [
      'Fournir des informations exactes',
      'Utiliser le service à des fins licites',
      'Préserver la sécurité de son compte',
      'Ne pas redistribuer son accès',
    ],
  },
  {
    heading: 'Article 7 — Disponibilité',
    paragraphs: [
      'CraftCodes s’efforce d’assurer la disponibilité du service. Des interruptions peuvent survenir pour maintenance ou force majeure.',
    ],
  },
  {
    heading: 'Article 8 — Droit applicable',
    paragraphs: [
      'Les présentes CGV sont soumises au droit français. Une solution amiable sera recherchée avant toute action contentieuse.',
    ],
  },
] as const satisfies readonly LegalSection[];
