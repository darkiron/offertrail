import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { useI18n } from '../i18n';

const FR = {
  pageTitle: 'Mentions légales — OfferTrail',
  eyebrow: 'Informations légales',
  title: 'Mentions légales',
  updated: 'Dernière mise à jour : janvier 2026',
  sections: [
    { heading: 'Éditeur du site', body: <>OfferTrail est un service édité par CraftCodes.<br />Responsable de publication : Vincent<br />Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a></> },
    { heading: 'Hébergement', body: <>Ce service est hébergé par <strong>Vercel Inc.</strong><br />340 Pine Street, Suite 900 — San Francisco, CA 94104, États-Unis<br /><a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a></> },
    { heading: 'Propriété intellectuelle', body: "L'ensemble du contenu de ce site (structure, textes, code, design) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite de l'éditeur." },
    { heading: 'Responsabilité', body: "OfferTrail s'efforce d'assurer l'exactitude des informations présentes sur ce site. Toutefois, l'éditeur ne peut être tenu responsable des erreurs, omissions ou de l'indisponibilité du service. L'utilisation du service se fait sous la seule responsabilité de l'utilisateur." },
    { heading: 'Droit applicable', body: "Le présent site est soumis au droit français. Tout litige relatif à son utilisation relève de la compétence exclusive des tribunaux français." },
  ],
};

const EN = {
  pageTitle: 'Legal Notice — OfferTrail',
  eyebrow: 'Legal information',
  title: 'Legal Notice',
  updated: 'Last updated: January 2026',
  sections: [
    { heading: 'Publisher', body: <>OfferTrail is a service published by CraftCodes.<br />Publication manager: Vincent<br />Contact: <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a></> },
    { heading: 'Hosting', body: <>This service is hosted by <strong>Vercel Inc.</strong><br />340 Pine Street, Suite 900 — San Francisco, CA 94104, United States<br /><a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a></> },
    { heading: 'Intellectual property', body: "All content on this site (structure, text, code, design) is protected by copyright. Any reproduction, even partial, is prohibited without prior written authorisation from the publisher." },
    { heading: 'Liability', body: "OfferTrail endeavours to ensure the accuracy of information on this site. However, the publisher cannot be held responsible for errors, omissions or unavailability of the service. Use of the service is solely at the user's risk." },
    { heading: 'Applicable law', body: "This site is governed by French law. Any dispute relating to its use falls under the exclusive jurisdiction of French courts." },
  ],
};

export const LegalNoticePage: React.FC = () => {
  const { locale } = useI18n();
  const c = locale === 'en' ? EN : FR;

  React.useEffect(() => { document.title = c.pageTitle; }, [c.pageTitle]);

  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} updated={c.updated}>
      {c.sections.map((s) => (
        <div key={s.heading} className="legal-section">
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </div>
      ))}
    </LegalLayout>
  );
};
