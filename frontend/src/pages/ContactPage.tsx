import React, { useState } from 'react';
import '../styles/legal.css';
import { LegalLayout } from '../components/LegalLayout';
import { useI18n } from '../i18n';
import { LEGAL_CONFIG } from '../config/legal';

const contactStyles = `
  .contact-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .contact-info-card {
    padding: 20px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    background: color-mix(in srgb, var(--bg-surface) 40%, transparent);
  }

  .contact-info-card-icon { font-size: 20px; margin-bottom: 8px; }
  .contact-info-card h3 { font-size: 14px; font-weight: 800; margin: 0 0 6px; }

  .contact-info-card a {
    font-size: 14px;
    color: var(--accent);
    text-decoration: none;
  }

  .contact-info-card a:hover { text-decoration: underline; }
  .contact-info-card p { font-size: 14px; color: var(--text-dim); margin: 0; }

  .contact-form { display: grid; gap: 16px; }

  .contact-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .contact-field { display: grid; gap: 6px; }

  .contact-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
  }

  .contact-input, .contact-textarea {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
    background: color-mix(in srgb, var(--bg-base) 88%, transparent);
    color: var(--text-main);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: inherit;
  }

  .contact-input:focus, .contact-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent);
  }

  .contact-textarea { min-height: 120px; resize: vertical; }

  .contact-submit {
    padding: 13px 24px;
    border-radius: 999px;
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    color: white;
    font-weight: 800;
    font-size: 14px;
    border: none;
    cursor: pointer;
    width: fit-content;
    transition: opacity 0.15s;
  }

  .contact-submit:hover { opacity: 0.88; }
  .contact-submit:disabled { opacity: 0.6; cursor: wait; }

  .contact-success {
    padding: 14px 18px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--status-offer) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--status-offer) 28%, transparent);
    color: var(--status-offer);
    font-size: 14px;
  }

  @media (max-width: 560px) {
    .contact-cards { grid-template-columns: 1fr; }
    .contact-row   { grid-template-columns: 1fr; }
  }
`;

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
      <style>{contactStyles}</style>

      <div className="contact-cards">
        <div className="contact-info-card">
          <div className="contact-info-card-icon">✉️</div>
          <h3>{c.emailLabel}</h3>
          <a href={`mailto:${LEGAL_CONFIG.company.email}`}>{LEGAL_CONFIG.company.email}</a>
        </div>
        <div className="contact-info-card">
          <div className="contact-info-card-icon">⏱️</div>
          <h3>{c.delayLabel}</h3>
          <p>{c.delayValue}</p>
        </div>
      </div>

      <div className="legal-section">
        <h2>{c.formTitle}</h2>
        {sent ? (
          <div className="contact-success">{c.success}</div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-row">
              <div className="contact-field">
                <label className="contact-label">{c.name}</label>
                <input className="contact-input" type="text" placeholder={c.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="contact-field">
                <label className="contact-label">{c.email}</label>
                <input className="contact-input" type="email" placeholder={c.emailPlaceholder} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="contact-field">
              <label className="contact-label">{c.subject}</label>
              <input className="contact-input" type="text" placeholder={c.subjectPlaceholder} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="contact-field">
              <label className="contact-label">{c.message}</label>
              <textarea className="contact-textarea" placeholder={c.messagePlaceholder} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button className="contact-submit" type="submit" disabled={loading}>
              {loading ? c.sending : c.send}
            </button>
          </form>
        )}
      </div>
    </LegalLayout>
  );
};
