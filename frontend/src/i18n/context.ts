import { createContext } from 'react';
import type { Locale } from './types';
import type { TranslationKey } from './locales';

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);
