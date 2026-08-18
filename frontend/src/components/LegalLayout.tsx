import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import '../styles/legal.css';

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ eyebrow, title, updated, children }) => {
  const { t } = useI18n();

  return (
    <main className="legal-content">
      <nav className="legal-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">{t('common.home')}</Link><span aria-hidden="true">/</span><span>{title}</span>
      </nav>
      <div className="legal-eyebrow">{eyebrow}</div>
      <h1 className="legal-title">{title}</h1>
      {updated ? <p className="legal-updated">{updated}</p> : null}
      {children}
    </main>
  );
};
