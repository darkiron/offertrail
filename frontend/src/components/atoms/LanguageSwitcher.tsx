import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n';
import classes from './LanguageSwitcher.module.css';

const LOCALES: { value: Locale; label: string }[] = [{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return <label className={classes.switcher}><span className="sr-only">{t('common.languageLabel')}</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={t('common.languageLabel')}>{LOCALES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
}
