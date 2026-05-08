import React from 'react';
import { useTranslation } from 'react-i18next';
import './i18n/config';

export { default as i18n } from './i18n/config';

export const useI18n = () => {
  const { t, i18n: instance } = useTranslation();
  return {
    t: (key: string, options?: Record<string, unknown>) => t(key, options) as string,
    locale: instance.language,
    changeLanguage: (lng: string) => instance.changeLanguage(lng),
  };
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
