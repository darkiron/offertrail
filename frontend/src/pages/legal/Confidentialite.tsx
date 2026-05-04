import React from 'react';
import { LegalLayout } from '../../components/LegalLayout';
import { useI18n } from '../../i18n';

export const Confidentialite: React.FC = () => {
  const { t } = useI18n();
  React.useEffect(() => {
    document.title = t('legal.privacy') + ' — OfferTrail';
  }, [t]);

  return (
    <LegalLayout
      eyebrow={t('legal.eyebrowPrivacy')}
      title={t('legal.privacy')}
      updated={t('legal.updated')}
    >
      <div className="legal-section">
        <h2>{t('legal.privacyPage.controllerTitle')}</h2>
        <p>
          {t('legal.privacyPage.controllerText')}<br />
          Contact RGPD : <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.hostingTitle')}</h2>
        <p>{t('legal.privacyPage.hostingText')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.dataTitle')}</h2>
        <p>{t('legal.privacyPage.dataIntro')}</p>
        <ul>
          {(t('legal.privacyPage.dataItems', { returnObjects: true }) as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.purposeTitle')}</h2>
        <p>{t('legal.privacyPage.purposeIntro')}</p>
        <ul>
          {(t('legal.privacyPage.purposeItems', { returnObjects: true }) as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>{t('legal.privacyPage.purposeNote')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.retentionTitle')}</h2>
        <p>{t('legal.privacyPage.retentionText')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.rightsTitle')}</h2>
        <p>{t('legal.privacyPage.rightsIntro')}</p>
        <ul>
          {(t('legal.privacyPage.rightsItems', { returnObjects: true }) as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p>
          {t('legal.privacyPage.rightsContact')}{' '}
          <a href="mailto:contact@craftcodes.fr">contact@craftcodes.fr</a>.{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">CNIL</a>.
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.cookiesTitle')}</h2>
        <p>{t('legal.privacyPage.cookiesText')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('legal.privacyPage.paymentTitle')}</h2>
        <p>{t('legal.privacyPage.paymentText')}</p>
      </div>
    </LegalLayout>
  );
};
