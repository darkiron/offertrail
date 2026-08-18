import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import classes from './LandingLayout.module.css';
import { LEGAL_CONFIG } from '../config/legal';
import { CONFIG } from '../config';
import { useI18n } from '../i18n';
import { LanguageSwitcher } from '../components/atoms/LanguageSwitcher';

export function LandingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { t } = useI18n();
  const toggleMenu = () => setMobileMenuOpen((open) => !open);
  const closeMenu = () => setMobileMenuOpen(false);
  return <div className={classes.root} data-theme={dark ? 'dark' : 'light'}>
    <nav className={classes.nav} aria-label="Navigation principale"><div className={classes.navInner}>
      <Link to="/" className={classes.logo}><span className={classes.logoMark}>OT</span><span className={classes.logoName}>{LEGAL_CONFIG.productName}</span></Link>
      <div className={classes.navCenter}><a href="/#features" className={classes.navLink}>{t('landing.nav.features')}</a><a href="/#tarifs" className={classes.navLink}>{t('landing.nav.pricing')}</a></div>
      <div className={classes.navActions}><LanguageSwitcher /><button className={classes.themeButton} type="button" onClick={() => setDark((value) => !value)} aria-label="Changer le thème">{dark ? '☼' : '☾'}</button><Link to="/login" className={classes.btnOutline}>{t('landing.nav.login')}</Link><Link to="/register" className={classes.btnPrimary}>{t('landing.nav.cta')}</Link></div>
      <div className={classes.navBurger}><button className={classes.themeButton} type="button" onClick={() => setDark((value) => !value)} aria-label="Changer le thème">{dark ? '☼' : '☾'}</button><button className={classes.menuButton} type="button" onClick={toggleMenu} aria-expanded={mobileMenuOpen} aria-controls="public-mobile-menu" aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>{mobileMenuOpen ? '×' : '☰'}</button></div>
    </div></nav>
    {mobileMenuOpen&&<div id="public-mobile-menu" className={classes.mobileMenu}><a href="/#features" className={classes.navLink} onClick={closeMenu}>{t('landing.nav.features')}</a><a href="/#tarifs" className={classes.navLink} onClick={closeMenu}>{t('landing.nav.pricing')}</a><Link to="/login" className={classes.btnOutline} onClick={closeMenu}>{t('landing.nav.login')}</Link><Link to="/register" className={classes.btnPrimary} onClick={closeMenu}>{t('landing.nav.cta')}</Link><LanguageSwitcher /></div>}
    <main className={classes.main}><Outlet /></main>
    <footer className={classes.footer}><div className={classes.footerInner}><span className={classes.footerCopy}>© {new Date().getFullYear()} {LEGAL_CONFIG.productName} — <a href={CONFIG.CRAFTCODES_URL} target="_blank" rel="noopener noreferrer">{LEGAL_CONFIG.company.name}</a></span><div className={classes.footerLinks}><a href="/#tarifs" className={classes.footerLink}>{t('landing.footer.pricing')}</a><Link to="/app/legal/cgu" className={classes.footerLink}>{t('landing.footer.terms')}</Link><Link to="/app/legal/confidentialite" className={classes.footerLink}>{t('landing.footer.privacy')}</Link><Link to="/mentions-legales" className={classes.footerLink}>{t('landing.footer.legal')}</Link><Link to="/contact" className={classes.footerLink}>{t('landing.footer.contact')}</Link></div></div></footer>
  </div>;
}
