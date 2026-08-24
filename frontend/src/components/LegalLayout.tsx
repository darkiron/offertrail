import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { legalDocuments } from '../legal';
import type { LegalDocumentId } from '../legal';
import classes from './LegalLayout.module.scss';

type LegalLayoutProps =
  | { documentId: LegalDocumentId; children?: never }
  | {
      documentId?: never;
      eyebrow: string;
      title: string;
      updated?: string;
      children: ReactNode;
    };

export function LegalLayout(props: LegalLayoutProps) {
  const { locale, t } = useI18n();
  const legalDocument = props.documentId
    ? legalDocuments[locale][props.documentId]
    : null;
  const legacy = 'title' in props ? props : null;
  useEffect(() => {
    if (legalDocument) document.title = legalDocument.pageTitle;
  }, [legalDocument]);
  const title = legalDocument?.title ?? legacy?.title ?? '';
  const eyebrow = legalDocument?.eyebrow ?? legacy?.eyebrow ?? '';
  const updated = legalDocument?.updated ?? legacy?.updated;
  return (
    <article
      className={classes.content}
      data-document={legalDocument?.id}
      data-version={legalDocument?.version}
    >
      <nav className={classes.breadcrumbs} aria-label={t('common.breadcrumb')}>
        <Link to="/">{t('common.home')}</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>
      <div className={classes.eyebrow}>{eyebrow}</div>
      <h1 className={classes.title}>{title}</h1>
      {updated ? <p className={classes.updated}>{updated}</p> : null}
      {legalDocument
        ? legalDocument.sections.map((section) => (
            <section key={section.heading} className={classes.section}>
              <h2>{section.heading}</h2>
              {section.subheading ? <h3>{section.subheading}</h3> : null}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))
        : legacy?.children}
    </article>
  );
}
