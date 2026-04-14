import React from 'react';
import { LegalLayout } from '../components/LegalLayout';

export const TermsPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Conditions générales de vente — OfferTrail';
  }, []);

  return (
    <LegalLayout
      eyebrow="Conditions commerciales"
      title="Conditions Générales de Vente"
      updated="Dernière mise à jour : janvier 2026"
    >
      <div className="legal-section">
        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes CGV régissent l'accès et l'utilisation du service OfferTrail,
          édité par CraftCodes, un outil SaaS de suivi de candidatures. Elles s'appliquent à tout abonnement souscrit.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 2 — Description du service</h2>
        <p>
          OfferTrail est proposé sous la forme d'un abonnement unique
          <strong> Plan Pro (14,99 EUR / mois)</strong>, donnant accès aux fonctionnalités
          disponibles du service.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 3 — Tarification et facturation</h2>
        <p>
          Le Plan Pro est facturé <strong>14,99 EUR TTC par mois</strong>, sans engagement minimum.
          Le renouvellement est automatique à chaque période mensuelle.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 4 — Résiliation</h2>
        <p>
          L'utilisateur peut résilier son abonnement à tout moment depuis "Mon compte".
          La résiliation prend effet à la fin de la période mensuelle en cours.
          Aucun remboursement prorata temporis n'est effectué.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 5 — Droit de rétractation</h2>
        <p>
          Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation
          ne s'applique pas aux services pleinement exécutés après accord exprès de l'utilisateur.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 6 — Obligations de l'utilisateur</h2>
        <p>L'utilisateur s'engage à :</p>
        <ul>
          <li>Fournir des informations exactes lors de l'inscription</li>
          <li>Ne pas utiliser le service à des fins illicites</li>
          <li>Ne pas tenter de compromettre la sécurité du service</li>
          <li>Être l'unique utilisateur de son compte</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>Article 7 — Disponibilité du service</h2>
        <p>
          OfferTrail s'efforce d'assurer une disponibilité maximale, sans garantie permanente.
          Des interruptions peuvent survenir pour maintenance ou force majeure, sans compensation due.
        </p>
      </div>

      <div className="legal-section">
        <h2>Article 8 — Droit applicable et litiges</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige, une solution
          amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.
        </p>
      </div>
    </LegalLayout>
  );
};
