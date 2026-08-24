import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LegalLayout } from '@widgets/legal/LegalLayout';
import { LEGAL_CONFIG } from '../config/legal';
import { useI18n } from '../i18n';
import classes from './ContactPage.module.scss';

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
const EMPTY_FORM: ContactForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export const ContactPage = () => {
  const { t } = useI18n();
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);

  useEffect(() => {
    document.title = t('contactPage.pageTitle');
  }, [t]);

  const update = (field: keyof ContactForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = form.subject.trim() || t('contactPage.emailSubject');
    const body = `${t('contactPage.emailFrom')}: ${form.name} <${form.email}>\n\n${form.message}`;
    window.location.assign(
      `mailto:${LEGAL_CONFIG.company.email}?${new URLSearchParams({ subject, body })}`,
    );
  };

  return (
    <LegalLayout
      eyebrow={t('contactPage.eyebrow')}
      title={t('contactPage.title')}
      updated={t('contactPage.introduction')}
    >
      <div className={classes.cards}>
        <section className={classes.infoCard}>
          <span className={classes.infoIcon} aria-hidden="true">
            @
          </span>
          <h2>{t('contactPage.emailLabel')}</h2>
          <a href={`mailto:${LEGAL_CONFIG.company.email}`}>
            {LEGAL_CONFIG.company.email}
          </a>
        </section>
        <section className={classes.infoCard}>
          <span className={classes.infoIcon} aria-hidden="true">
            48h
          </span>
          <h2>{t('contactPage.responseLabel')}</h2>
          <p>{t('contactPage.responseValue')}</p>
        </section>
      </div>

      <section
        className={classes.formSection}
        aria-labelledby="contact-form-title"
      >
        <h2 id="contact-form-title">{t('contactPage.formTitle')}</h2>
        <p className={classes.hint}>{t('contactPage.formHint')}</p>
        <form className={classes.form} onSubmit={handleSubmit}>
          <div className={classes.row}>
            <label className="ot-field" htmlFor="contact-name">
              <span>{t('contactPage.name')}</span>
              <input
                id="contact-name"
                className="ot-control"
                type="text"
                autoComplete="name"
                placeholder={t('contactPage.namePlaceholder')}
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                required
              />
            </label>
            <label className="ot-field" htmlFor="contact-email">
              <span>{t('contactPage.email')}</span>
              <input
                id="contact-email"
                className="ot-control"
                type="email"
                autoComplete="email"
                placeholder={t('contactPage.emailPlaceholder')}
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                required
              />
            </label>
          </div>
          <label className="ot-field" htmlFor="contact-subject">
            <span>{t('contactPage.subject')}</span>
            <input
              id="contact-subject"
              className="ot-control"
              type="text"
              placeholder={t('contactPage.subjectPlaceholder')}
              value={form.subject}
              onChange={(event) => update('subject', event.target.value)}
              required
            />
          </label>
          <label className="ot-field" htmlFor="contact-message">
            <span>{t('contactPage.message')}</span>
            <textarea
              id="contact-message"
              className={`ot-control ${classes.textarea}`}
              placeholder={t('contactPage.messagePlaceholder')}
              value={form.message}
              onChange={(event) => update('message', event.target.value)}
              required
            />
          </label>
          <button className="ot-button" data-variant="primary" type="submit">
            {t('contactPage.send')}
          </button>
        </form>
      </section>
    </LegalLayout>
  );
};
