import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LandingFaq } from '../components/landing/organisms/LandingFaq';
import { LandingHero } from '../components/landing/organisms/LandingHero';
import { LandingPricing } from '../components/landing/organisms/LandingPricing';
import { LandingWorkflow } from '../components/landing/organisms/LandingWorkflow';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../i18n';
import classes from './LandingPage.module.scss';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { hash } = useLocation();

  useEffect(() => {
    document.title = t('landing.hero.pageTitle');
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (description) description.content = t('landing.hero.sub');
  }, [t]);

  useEffect(() => {
    if (!hash) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <div className={classes.page}>
      <LandingHero />
      <LandingWorkflow />
      <LandingPricing />
      <LandingFaq />
    </div>
  );
}
