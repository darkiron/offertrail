import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { I18nContext } from './context';
import type { I18nValue } from './context';
import { locales } from './locales';
import type { TranslationKey } from './locales';
import type { Locale } from './types';

const STORAGE_KEY = 'ot_locale';

const resolveLocale = (): Locale => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fr' || stored === 'en') return stored;
  return navigator.language.split('-')[0] === 'en' ? 'en' : 'fr';
};

const getValue = (locale: Locale, key: TranslationKey): string => {
  let current: unknown = locales[locale];

  for (const part of key.split('.')) {
    if (!current || typeof current !== 'object' || !(part in current))
      return key;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : key;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveLocale);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => getValue(locale, key),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
