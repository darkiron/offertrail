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
        <h2>{t('legal.mentionsPage.editorTitle')}</h2>
        <p>
          {t('legal.mentionsPage.editorText')}<br />
          Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.mentionsPage.hostingTitle')}</h2>
        <p>
          {t('legal.mentionsPage.hostingText')}<br />
          <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.mentionsPage.ipTitle')}</h2>
        <p>{t('legal.mentionsPage.ipText')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.mentionsPage.liabilityTitle')}</h2>
        <p>{t('legal.mentionsPage.liabilityText')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.mentionsPage.lawTitle')}</h2>
        <p>{t('legal.mentionsPage.lawText')}</p>
      </div>
    </LegalLayout>
  );
};
