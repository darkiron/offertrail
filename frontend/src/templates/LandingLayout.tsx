import { useEffect, useRef, useState } from 'react';
import { IconMenu2, IconMoon, IconSun, IconX } from '@tabler/icons-react';
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
  const [dark, setDark] = useState(
    () => localStorage.getItem('offertrail.color-scheme') === 'dark',
  );
  const { t } = useI18n();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      localStorage.setItem('offertrail.color-scheme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const menu = mobileMenuRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();
    const keepFocusInMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keepFocusInMenu);
    return () => document.removeEventListener('keydown', keepFocusInMenu);
  }, [mobileMenuOpen]);
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
      <a className={classes.skipLink} href="#public-content">
        {t('common.skipToContent')}
      </a>
      <nav className={classes.nav} aria-label={t('common.primaryNavigation')}>
        <div className={classes.navInner}>
          <PublicBrand />
          <div className={classes.navCenter}>{renderNavigation()}</div>
          <div className={classes.navActions}>
            <LanguageSwitcher />
            <button
              className={classes.themeButton}
              type="button"
              onClick={toggleTheme}
              aria-label={t('common.changeTheme')}
            >
              {dark ? (
                <IconSun aria-hidden="true" />
              ) : (
                <IconMoon aria-hidden="true" />
              )}
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
              onClick={toggleTheme}
              aria-label={t('common.changeTheme')}
            >
              {dark ? (
                <IconSun aria-hidden="true" />
              ) : (
                <IconMoon aria-hidden="true" />
              )}
            </button>
            <button
              ref={menuButtonRef}
              className={classes.menuButton}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-menu"
              aria-label={t(
                mobileMenuOpen ? 'common.closeMenu' : 'common.openMenu',
              )}
            >
              {mobileMenuOpen ? (
                <IconX aria-hidden="true" />
              ) : (
                <IconMenu2 aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>
      {mobileMenuOpen ? (
        <nav
          ref={mobileMenuRef}
          id="public-mobile-menu"
          className={classes.mobileMenu}
          aria-label={t('common.primaryNavigation')}
        >
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
        </nav>
      ) : null}
      <main id="public-content" className={classes.main} tabIndex={-1}>
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
            <Link to="/cgu" className={classes.footerLink}>
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
