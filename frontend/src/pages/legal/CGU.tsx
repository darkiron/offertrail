import React from 'react';
import { LegalLayout } from '../../components/LegalLayout';
import { useI18n } from '../../i18n';

export const CGU: React.FC = () => {
  const { t } = useI18n();
  React.useEffect(() => {
    document.title = t('legal.cgu') + ' — OfferTrail';
  }, [t]);

  return (
    <LegalLayout
      eyebrow={t('legal.eyebrowTerms')}
      title={t('legal.cgu')}
      updated={t('legal.updated')}
    >
      <div className="legal-section">
        <h2>{t('legal.cguPage.s1Title')}</h2>
        <p>
          OfferTrail {t('legal.cguPage.s1Text')}<br />
          Contact : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s2Title')}</h2>
        <p>{t('legal.cguPage.s2Text')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s3Title')}</h2>
        <p>{t('legal.cguPage.s3Text')}</p>
        <p>{t('legal.cguPage.s3Pricing')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s4Title')}</h2>
        <p>{t('legal.cguPage.s4Text')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s5Title')}</h2>
        <p>{t('legal.cguPage.s5Intro')}</p>
        <ul>
          {(t('legal.cguPage.s5Items', { returnObjects: true }) as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s6Title')}</h2>
        <p>{t('legal.cguPage.s6Text')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s7Title')}</h2>
        <p>{t('legal.cguPage.s7Text')}</p>
        <p>{t('legal.cguPage.s7Note')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s8Title')}</h2>
        <p>{t('legal.cguPage.s8Text')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s9Title')}</h2>
        <p>{t('legal.cguPage.s9Text')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.cguPage.s10Title')}</h2>
        <p>{t('legal.cguPage.s10Text')}</p>
      </div>
    </LegalLayout>
  );
};
