import React from 'react';
import { useTranslation } from 'react-i18next';
import './i18n/config';

interface I18nValue {
  locale: string;
  t: (key: string) => string;
  changeLanguage: (lng: string) => void;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = (): I18nValue => {
  const { t, i18n } = useTranslation();

  return {
    locale: i18n.language,
    t: (key: string) => t(key),
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
  };
};
