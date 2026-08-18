import React, { useState } from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { useI18n } from '../i18n';
import { LEGAL_CONFIG } from '../config/legal';

import classes from './ContactPage.module.css';

const C = {
  fr: {
    pageTitle: 'Contact — OfferTrail',
    eyebrow: 'Support & assistance',
    title: 'Nous contacter',
    updated: 'Une question, un bug, une demande RGPD ? On vous répond sous 48h ouvrées.',
    emailLabel: 'Email direct',
    delayLabel: 'Délai de réponse',
    delayValue: 'Sous 48h ouvrées en général.',
    formTitle: 'Envoyer un message',
    success: 'Message envoyé — merci ! On vous répond dès que possible.',
    name: 'Nom', namePlaceholder: 'Votre nom',
    email: 'Email', emailPlaceholder: 'vous@exemple.fr',
    subject: 'Sujet', subjectPlaceholder: "Question sur l'abonnement, bug, demande RGPD...",
    message: 'Message', messagePlaceholder: 'Décrivez votre demande...',
    send: 'Envoyer le message', sending: 'Envoi...',
  },
  en: {
    pageTitle: 'Contact — OfferTrail',
    eyebrow: 'Support & assistance',
    title: 'Contact us',
    updated: 'A question, a bug, a GDPR request? We reply within 48 business hours.',
    emailLabel: 'Direct email',
    delayLabel: 'Response time',
    delayValue: 'Usually within 48 business hours.',
    formTitle: 'Send a message',
    success: 'Message sent — thank you! We will get back to you as soon as possible.',
    name: 'Name', namePlaceholder: 'Your name',
    email: 'Email', emailPlaceholder: 'you@example.com',
    subject: 'Subject', subjectPlaceholder: 'Subscription question, bug, GDPR request...',
    message: 'Message', messagePlaceholder: 'Describe your request...',
    send: 'Send message', sending: 'Sending...',
  },
};

export const ContactPage: React.FC = () => {
  const { locale } = useI18n();
  const c = locale === 'en' ? C.en : C.fr;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  React.useEffect(() => { document.title = c.pageTitle; }, [c.pageTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <LegalLayout eyebrow={c.eyebrow} title={c.title} updated={c.updated}>
      <div className={classes.cards}>
        <div className={classes.infoCard}>
          <div className={classes.infoIcon}>✉️</div>
          <h3>{c.emailLabel}</h3>
          <a href={`mailto:${LEGAL_CONFIG.company.email}`}>{LEGAL_CONFIG.company.email}</a>
        </div>
        <div className={classes.infoCard}>
          <div className={classes.infoIcon}>⏱️</div>
          <h3>{c.delayLabel}</h3>
          <p>{c.delayValue}</p>
        </div>
      </div>

      <div className="legal-section">
        <h2>{c.formTitle}</h2>
        {sent ? (
          <div className={classes.success}>{c.success}</div>
        ) : (
          <form className={classes.form} onSubmit={handleSubmit}>
            <div className={classes.row}>
              <div className={classes.field}>
                <label className={classes.label}>{c.name}</label>
                <input className={classes.input} type="text" placeholder={c.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className={classes.field}>
                <label className={classes.label}>{c.email}</label>
                <input className={classes.input} type="email" placeholder={c.emailPlaceholder} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className={classes.field}>
              <label className={classes.label}>{c.subject}</label>
              <input className={classes.input} type="text" placeholder={c.subjectPlaceholder} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className={classes.field}>
              <label className={classes.label}>{c.message}</label>
              <textarea className={classes.textarea} placeholder={c.messagePlaceholder} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button className={classes.submit} type="submit" disabled={loading}>
              {loading ? c.sending : c.send}
            </button>
          </form>
        )}
      </div>
    </LegalLayout>
  );
};
