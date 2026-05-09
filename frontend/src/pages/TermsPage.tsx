import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { useI18n } from '../i18n';

const FR = {
  pageTitle: 'Conditions générales de vente — OfferTrail',
  eyebrow: 'Conditions commerciales',
  title: 'Conditions Générales de Vente',
  updated: 'Dernière mise à jour : janvier 2026',
  sections: [
    { heading: 'Article 1 — Objet', body: "Les présentes CGV régissent l'accès et l'utilisation du service OfferTrail, édité par CraftCodes, un outil SaaS de suivi de candidatures. Elles s'appliquent à tout abonnement souscrit." },
    { heading: 'Article 2 — Description du service', body: <>OfferTrail est proposé sous la forme d'un abonnement unique <strong>Plan Pro (14,99 EUR / mois)</strong>, donnant accès aux fonctionnalités disponibles du service.</> },
    { heading: 'Article 3 — Tarification et facturation', body: <>Le Plan Pro est facturé <strong>14,99 EUR TTC par mois</strong>, sans engagement minimum. Le renouvellement est automatique à chaque période mensuelle.</> },
    { heading: 'Article 4 — Résiliation', body: 'L\'utilisateur peut résilier son abonnement à tout moment depuis "Mon compte". La résiliation prend effet à la fin de la période mensuelle en cours. Aucun remboursement prorata temporis n\'est effectué.' },
    { heading: 'Article 5 — Droit de rétractation', body: "Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux services pleinement exécutés après accord exprès de l'utilisateur." },
    { heading: 'Article 6 — Obligations de l\'utilisateur', list: ['Fournir des informations exactes lors de l\'inscription', 'Ne pas utiliser le service à des fins illicites', 'Ne pas tenter de compromettre la sécurité du service', 'Être l\'unique utilisateur de son compte'], prefix: "L'utilisateur s'engage à :" },
    { heading: 'Article 7 — Disponibilité du service', body: "OfferTrail s'efforce d'assurer une disponibilité maximale, sans garantie permanente. Des interruptions peuvent survenir pour maintenance ou force majeure, sans compensation due." },
    { heading: 'Article 8 — Droit applicable et litiges', body: "Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents." },
  ],
};

const EN = {
  pageTitle: 'Terms of Sale — OfferTrail',
  eyebrow: 'Commercial terms',
  title: 'Terms of Sale',
  updated: 'Last updated: January 2026',
  sections: [
    { heading: 'Article 1 — Purpose', body: 'These Terms of Sale govern access to and use of the OfferTrail service, published by CraftCodes, a SaaS job-application tracking tool. They apply to all subscriptions taken out.' },
    { heading: 'Article 2 — Service description', body: <>OfferTrail is offered as a single subscription: <strong>Pro Plan (€14.99 / month)</strong>, giving access to all available features of the service.</> },
    { heading: 'Article 3 — Pricing and billing', body: <>The Pro Plan is billed at <strong>€14.99 incl. VAT per month</strong>, with no minimum commitment. Renewal is automatic each monthly period.</> },
    { heading: 'Article 4 — Cancellation', body: 'The user may cancel their subscription at any time from "My account". Cancellation takes effect at the end of the current monthly period. No pro-rata refund is made.' },
    { heading: 'Article 5 — Right of withdrawal', body: 'In accordance with article L.221-28 of the French Consumer Code, the right of withdrawal does not apply to services fully performed after the user\'s express consent.' },
    { heading: 'Article 6 — User obligations', list: ['Provide accurate information at registration', 'Not use the service for unlawful purposes', 'Not attempt to compromise the security of the service', 'Be the sole user of their account'], prefix: 'The user agrees to:' },
    { heading: 'Article 7 — Service availability', body: 'OfferTrail endeavours to ensure maximum availability, without permanent guarantee. Interruptions may occur for maintenance or force majeure, without compensation.' },
    { heading: 'Article 8 — Applicable law and disputes', body: 'These Terms of Sale are governed by French law. In the event of a dispute, an amicable solution will be sought first. Failing that, French courts shall have jurisdiction.' },
  ],
};

export const TermsPage: React.FC = () => {
  const { locale } = useI18n();
  const c = locale === 'en' ? EN : FR;

  React.useEffect(() => { document.title = c.pageTitle; }, [c.pageTitle]);

  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} updated={c.updated}>
      {c.sections.map((s) => (
        <div key={s.heading} className="legal-section">
          <h2>{s.heading}</h2>
          {'list' in s ? (
            <>
              <p>{s.prefix}</p>
              <ul>{s.list!.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : (
            <p>{s.body}</p>
          )}
        </div>
      ))}
    </LegalLayout>
  );
};
