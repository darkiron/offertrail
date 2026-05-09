import React from 'react';
import { LegalLayout } from '../../components/LegalLayout';
import { useI18n } from '../../i18n';

const FR = { pageTitle: "Conditions Générales d'Utilisation — OfferTrail", eyebrow: "Conditions d'utilisation", title: "Conditions Générales d'Utilisation", updated: 'Dernière mise à jour : janvier 2026' };
const EN = { pageTitle: 'Terms of Use — OfferTrail', eyebrow: 'Terms of use', title: 'Terms of Use', updated: 'Last updated: January 2026' };

export const CGU: React.FC = () => {
  const { locale } = useI18n();
  const c = locale === 'en' ? EN : FR;
  React.useEffect(() => { document.title = c.pageTitle; }, [c.pageTitle]);
  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} updated={c.updated}>
      {locale === 'en' ? <CGUEN /> : <CGUFR />}
    </LegalLayout>
  );
};

const CGUFR: React.FC = () => (
  <>
    <div className="legal-section"><h2>Article 1 — Éditeur du service</h2><p>OfferTrail est édité par <strong>CraftCodes</strong>.<br />Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a></p></div>
    <div className="legal-section"><h2>Article 2 — Objet</h2><p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service OfferTrail, outil SaaS de suivi de candidatures. En créant un compte, l'utilisateur accepte sans réserve les présentes CGU.</p></div>
    <div className="legal-section"><h2>Article 3 — Description du service</h2><p>OfferTrail permet de gérer un pipeline de candidatures, de suivre les entreprises et contacts, de planifier des relances et de visualiser des statistiques de recherche d'emploi.</p><p>Le service est accessible via un abonnement mensuel <strong>Plan Pro (14,99 EUR TTC / mois)</strong>. L'accès au service est conditionné à la souscription d'un abonnement actif.</p></div>
    <div className="legal-section"><h2>Article 4 — Compte utilisateur</h2><p>L'accès au service requiert la création d'un compte avec une adresse e-mail valide. L'utilisateur est seul responsable de la confidentialité de ses identifiants. Tout accès via le compte est réputé effectué par l'utilisateur titulaire.</p></div>
    <div className="legal-section"><h2>Article 5 — Utilisation acceptable</h2><p>L'utilisateur s'engage à :</p><ul><li>Utiliser le service à des fins personnelles et licites uniquement</li><li>Ne pas tenter d'accéder aux données d'autres utilisateurs</li><li>Ne pas compromettre la sécurité ou les performances du service</li><li>Ne pas revendre ou redistribuer l'accès au service</li></ul></div>
    <div className="legal-section">
      <h2>Article 6 — Abonnement, renouvellement et résiliation</h2>
      <h3>Abonnement et renouvellement</h3>
      <p>L'abonnement à OfferTrail est automatiquement renouvelé par période mensuelle (sauf résiliation). Le prix en vigueur au moment du renouvellement s'applique.</p>
      <p>L'utilisateur reconnaît que l'accès au service est immédiat dès le paiement, ce qui exclut le droit de rétractation conformément à l'article L221-28 du Code de la consommation.</p>
      <h3>Résiliation</h3>
      <p>L'utilisateur peut résilier son abonnement à tout moment depuis son espace "Mon compte". La résiliation prend effet à la fin de la période mensuelle en cours. Aucun remboursement (pro rata temporis ou autre) n'est effectué pour les périodes déjà payées, y compris en cas de résiliation anticipée.</p>
      <h3>Non-remboursabilité</h3>
      <p>Les sommes versées pour la période en cours sont définitives et ne donnent lieu à aucun remboursement, sauf en cas d'erreur technique imputable à OfferTrail (ex. : double prélèvement).</p>
    </div>
    <div className="legal-section"><h2>Article 7 — Données et hébergement</h2><p>Les données utilisateur sont hébergées via <strong>Supabase</strong> sur des infrastructures situées dans l'Union européenne, conformément au RGPD.</p><p>Les données saisies restent la propriété exclusive de l'utilisateur. CraftCodes s'engage à ne pas les exploiter, céder ou revendre à des tiers.</p></div>
    <div className="legal-section"><h2>Article 8 — Disponibilité</h2><p>CraftCodes s'efforce d'assurer une disponibilité maximale du service, sans garantie de continuité permanente. Des interruptions peuvent survenir pour maintenance ou cas de force majeure, sans compensation due.</p></div>
    <div className="legal-section"><h2>Article 9 — Modification des CGU</h2><p>CraftCodes se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont informés par e-mail 30 jours avant l'entrée en vigueur des nouvelles conditions. L'utilisation continue du service vaut acceptation.</p></div>
    <div className="legal-section"><h2>Article 10 — Droit applicable</h2><p>Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.</p></div>
  </>
);

const CGUEN: React.FC = () => (
  <>
    <div className="legal-section"><h2>Article 1 — Publisher</h2><p>OfferTrail is published by <strong>CraftCodes</strong>.<br />Contact: <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a></p></div>
    <div className="legal-section"><h2>Article 2 — Purpose</h2><p>These Terms of Use govern access to and use of the OfferTrail service, a SaaS job-application tracking tool. By creating an account, the user unreservedly accepts these Terms.</p></div>
    <div className="legal-section"><h2>Article 3 — Service description</h2><p>OfferTrail lets you manage an application pipeline, track companies and contacts, schedule follow-ups and view job-search statistics.</p><p>The service is available via a monthly subscription: <strong>Pro Plan (€14.99 incl. VAT / month)</strong>. Access requires an active subscription.</p></div>
    <div className="legal-section"><h2>Article 4 — User account</h2><p>Access requires creating an account with a valid email address. The user is solely responsible for keeping their credentials confidential. Any access through the account is deemed to have been made by the account holder.</p></div>
    <div className="legal-section"><h2>Article 5 — Acceptable use</h2><p>The user agrees to:</p><ul><li>Use the service for personal and lawful purposes only</li><li>Not attempt to access other users' data</li><li>Not compromise the security or performance of the service</li><li>Not resell or redistribute access to the service</li></ul></div>
    <div className="legal-section">
      <h2>Article 6 — Subscription, renewal and cancellation</h2>
      <h3>Subscription and renewal</h3>
      <p>The OfferTrail subscription automatically renews on a monthly basis (unless cancelled). The price in effect at the time of renewal applies.</p>
      <p>The user acknowledges that access to the service is immediate upon payment, which excludes the right of withdrawal in accordance with Article L221-28 of the French Consumer Code.</p>
      <h3>Cancellation</h3>
      <p>The user may cancel their subscription at any time from their "My account" section. Cancellation takes effect at the end of the current monthly period. No refund (pro-rata or otherwise) is made for periods already paid, including in the event of early cancellation.</p>
      <h3>Non-refundability</h3>
      <p>Amounts paid for the current period are final and give rise to no refund, except in the event of a technical error attributable to OfferTrail (e.g. double charge).</p>
    </div>
    <div className="legal-section"><h2>Article 7 — Data and hosting</h2><p>User data is hosted via <strong>Supabase</strong> on infrastructure located in the European Union, in compliance with GDPR.</p><p>Data entered remains the exclusive property of the user. CraftCodes will not exploit, transfer or resell it to third parties.</p></div>
    <div className="legal-section"><h2>Article 8 — Availability</h2><p>CraftCodes endeavours to ensure maximum availability of the service, without permanent continuity guarantee. Interruptions may occur for maintenance or force majeure, without compensation.</p></div>
    <div className="legal-section"><h2>Article 9 — Updates to these Terms</h2><p>CraftCodes reserves the right to update these Terms at any time. Users will be notified by email 30 days before new conditions take effect. Continued use of the service constitutes acceptance.</p></div>
    <div className="legal-section"><h2>Article 10 — Applicable law</h2><p>These Terms are governed by French law. In the event of a dispute, an amicable solution will be sought first. Failing that, French courts shall have jurisdiction.</p></div>
  </>
);
