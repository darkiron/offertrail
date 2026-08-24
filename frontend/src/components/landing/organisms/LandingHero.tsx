import { IconArrowDown, IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { ProductPreview } from '../molecules/ProductPreview';
import classes from './LandingHero.module.scss';

export function LandingHero() {
  const { t } = useI18n();
  return (
    <header className={classes.hero} aria-labelledby="landing-title">
      <div className={classes.intro}>
        <p className={classes.eyebrow}>{t('landing.hero.badge')}</p>
        <h1 id="landing-title">
          {t('landing.hero.titleLine1')} <em>{t('landing.hero.titleLine2')}</em>
        </h1>
        <p className={classes.lead}>{t('landing.hero.sub')}</p>
        <div className={classes.actions}>
          <Link to="/register" className={classes.primary}>
            {t('landing.hero.ctaPrimary')}
            <IconArrowRight aria-hidden="true" />
          </Link>
          <a href="#workflow" className={classes.secondary}>
            {t('landing.hero.ctaSecondary')}
            <IconArrowDown aria-hidden="true" />
          </a>
        </div>
      </div>
      <ProductPreview />
    </header>
  );
}
