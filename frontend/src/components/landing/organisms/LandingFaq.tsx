import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import classes from './LandingFaq.module.scss';

export function LandingFaq() {
  const { t } = useI18n();
  return (
    <>
      <section className={classes.faq} id="faq" aria-labelledby="faq-title">
        <div className={classes.intro}>
          <p>{t('landing.faq.kicker')}</p>
          <h2 id="faq-title">{t('landing.faq.title')}</h2>
        </div>
        <div className={classes.list}>
          {(['1', '2', '3', '4'] as const).map((number) => (
            <details key={number}>
              <summary>
                {t(`landing.faq.q${number}`)}
                <IconPlus aria-hidden="true" />
              </summary>
              <p>{t(`landing.faq.a${number}`)}</p>
            </details>
          ))}
        </div>
      </section>
      <section className={classes.cta} aria-labelledby="landing-cta-title">
        <p>{t('landing.cta.kicker')}</p>
        <h2 id="landing-cta-title">{t('landing.cta.title')}</h2>
        <span>{t('landing.cta.sub')}</span>
        <Link to="/register">
          {t('landing.cta.btn')}
          <IconArrowRight aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
