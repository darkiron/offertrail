import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { useI18n } from '../i18n';

export const LegalNoticePage: React.FC = () => {
  const { t } = useI18n();
  React.useEffect(() => {
    document.title = t('legal.mentions') + ' — OfferTrail';
  }, [t]);

  return (
    <LegalLayout
      eyebrow={t('legal.eyebrowInfo')}
      title={t('legal.mentions')}
      updated={t('legal.updated')}
    >
      <div className="legal-section">
        <h2>Éditeur du site</h2>
        <p>
          OfferTrail est un service édité par CraftCodes.<br />
          Responsable de publication : Vincent<br />
          Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>Hébergement</h2>
        <p>
          Ce service est hébergé par <strong>Vercel Inc.</strong><br />
          340 Pine Street, Suite 900 — San Francisco, CA 94104, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu de ce site (structure, textes, code, design) est protégé par le droit d'auteur.
          Toute reproduction, même partielle, est interdite sans autorisation préalable écrite de l'éditeur.
        </p>
      </div>

      <div className="legal-section">
        <h2>Responsabilité</h2>
        <p>
          OfferTrail s'efforce d'assurer l'exactitude des informations présentes sur ce site. Toutefois,
          l'éditeur ne peut être tenu responsable des erreurs, omissions ou de l'indisponibilité du service.
          L'utilisation du service se fait sous la seule responsabilité de l'utilisateur.
        </p>
      </div>

      <div className="legal-section">
        <h2>Droit applicable</h2>
        <p>
          Le présent site est soumis au droit français. Tout litige relatif à son utilisation relève
          de la compétence exclusive des tribunaux français.
        </p>
      </div>
    </LegalLayout>
  );
};
