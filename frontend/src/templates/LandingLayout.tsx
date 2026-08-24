import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import type { TranslationKey } from '../i18n';
import { LEGAL_CONFIG } from '../config/legal';
import { CONFIG } from '../config';
import { useI18n } from '../i18n';
import { LanguageSwitcher } from '../components/atoms/LanguageSwitcher';
import { PublicBrand } from '../components/atoms/PublicBrand';
import classes from './LandingLayout.module.scss';

const publicNavigation = [
  { href: '/#features', label: 'landing.nav.features' },
  { href: '/#workflow', label: 'landing.nav.workflow' },
  { href: '/#tarifs', label: 'landing.nav.pricing' },
  { href: '/#faq', label: 'landing.nav.faq' },
] as const satisfies ReadonlyArray<{ href: string; label: TranslationKey }>;

export function LandingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { t } = useI18n();
  const renderNavigation = () =>
    publicNavigation.map((item) => (
      <a
        key={item.href}
        href={item.href}
        className={classes.navLink}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t(item.label)}
      </a>
    ));
  return (
    <div className={classes.root} data-theme={dark ? 'dark' : 'light'}>
      <nav className={classes.nav} aria-label={t('common.primaryNavigation')}>
        <div className={classes.navInner}>
          <PublicBrand />
          <div className={classes.navCenter}>{renderNavigation()}</div>
          <div className={classes.navActions}>
            <LanguageSwitcher />
            <button
              className={classes.themeButton}
              type="button"
              onClick={() => setDark((value) => !value)}
              aria-label={t('common.changeTheme')}
            >
              {dark ? '☼' : '☾'}
            </button>
            <Link to="/login" className={classes.btnOutline}>
              {t('landing.nav.login')}
            </Link>
            <Link to="/register" className={classes.btnPrimary}>
              {t('landing.nav.cta')}
            </Link>
          </div>
          <div className={classes.navBurger}>
            <button
              className={classes.themeButton}
              type="button"
              onClick={() => setDark((value) => !value)}
              aria-label={t('common.changeTheme')}
            >
              {dark ? '☼' : '☾'}
            </button>
            <button
              className={classes.menuButton}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-menu"
              aria-label={t(
                mobileMenuOpen ? 'common.closeMenu' : 'common.openMenu',
              )}
            >
              {mobileMenuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>
      </nav>
      {mobileMenuOpen ? (
        <div id="public-mobile-menu" className={classes.mobileMenu}>
          {renderNavigation()}
          <Link
            to="/login"
            className={classes.btnOutline}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('landing.nav.login')}
          </Link>
          <Link
            to="/register"
            className={classes.btnPrimary}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('landing.nav.cta')}
          </Link>
          <LanguageSwitcher />
        </div>
      ) : null}
      <main className={classes.main}>
        <Outlet />
      </main>
      <footer className={classes.footer}>
        <div className={classes.footerInner}>
          <span className={classes.footerCopy}>
            © {new Date().getFullYear()} {LEGAL_CONFIG.productName} —{' '}
            <a
              href={CONFIG.CRAFTCODES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {LEGAL_CONFIG.company.name}
            </a>
          </span>
          <div className={classes.footerLinks}>
            <a href="/#tarifs" className={classes.footerLink}>
              {t('landing.footer.pricing')}
            </a>
            <Link to="/app/legal/cgu" className={classes.footerLink}>
              {t('landing.footer.terms')}
            </Link>
            <Link to="/rgpd" className={classes.footerLink}>
              {t('landing.footer.privacy')}
            </Link>
            <Link to="/mentions-legales" className={classes.footerLink}>
              {t('landing.footer.legal')}
            </Link>
            <Link to="/contact" className={classes.footerLink}>
              {t('landing.footer.contact')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
