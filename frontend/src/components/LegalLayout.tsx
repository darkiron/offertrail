import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs, Anchor, Text } from '@mantine/core';
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
      <Breadcrumbs mb="lg" separatorMargin="xs">
        <Anchor component={Link} to="/" size="sm" c="dimmed">{t('common.home')}</Anchor>
        <Text size="sm" c="dimmed">{title}</Text>
      </Breadcrumbs>
      <div className="legal-eyebrow">{eyebrow}</div>
      <h1 className="legal-title">{title}</h1>
      {updated ? <p className="legal-updated">{updated}</p> : null}
      {children}
    </main>
  );
};
