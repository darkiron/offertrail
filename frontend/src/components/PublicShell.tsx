import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONFIG } from '../config/legal';
import { CONFIG } from '../config';
import { useI18n } from '../i18n';
import { AuthLanguageSwitcher } from './atoms/AuthLanguageSwitcher';
import { PublicBrand } from './atoms/PublicBrand';
import classes from './PublicShell.module.css';

type PublicShellProps = { children: ReactNode };

/** Consistent frame for login, registration and password recovery screens. */
export function PublicShell({ children }: PublicShellProps) {
  const { t } = useI18n();
  return <div className={classes.shell}>
    <header className={classes.header}><PublicBrand /><AuthLanguageSwitcher /></header>
    <main className={classes.main}>{children}</main>
    <footer className={classes.footer}>
      <span>© {new Date().getFullYear()} {LEGAL_CONFIG.productName} — <a href={CONFIG.CRAFTCODES_URL} target="_blank" rel="noopener noreferrer">{LEGAL_CONFIG.company.name}</a></span>
      <nav aria-label={t('landing.footer.legal')}>
        <Link to="/app/legal/confidentialite">{t('landing.footer.privacy')}</Link><Link to="/app/legal/cgu">{t('landing.footer.terms')}</Link><Link to="/mentions-legales">{t('landing.footer.legal')}</Link>
      </nav>
    </footer>
  </div>;
}
