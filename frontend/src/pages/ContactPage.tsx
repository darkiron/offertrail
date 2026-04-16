import React, { useState } from 'react';
import '../styles/legal.css';
import { LegalLayout } from '../components/LegalLayout';

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

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  React.useEffect(() => {
    document.title = 'Contact — OfferTrail';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: brancher sur endpoint /api/contact ou service de mail
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <LegalLayout
      eyebrow="Support & assistance"
      title="Nous contacter"
      updated="Une question, un bug, une demande RGPD ? On vous répond sous 48h ouvrées."
    >
      <style>{contactStyles}</style>

      <div className="contact-cards">
        <div className="contact-info-card">
          <div className="contact-info-card-icon">✉️</div>
          <h3>Email direct</h3>
          <a href="mailto:contact@offertrail.fr">contact@offertrail.fr</a>
        </div>
        <div className="contact-info-card">
          <div className="contact-info-card-icon">⏱️</div>
          <h3>Délai de réponse</h3>
          <p>Sous 48h ouvrées en général.</p>
        </div>
      </div>

      <div className="legal-section">
        <h2>Envoyer un message</h2>
        {sent ? (
          <div className="contact-success">
            Message envoyé — merci ! On vous répond dès que possible.
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-row">
              <div className="contact-field">
                <label className="contact-label">Nom</label>
                <input
                  className="contact-input"
                  type="text"
                  placeholder="Votre nom"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="contact-field">
                <label className="contact-label">Email</label>
                <input
                  className="contact-input"
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="contact-field">
              <label className="contact-label">Sujet</label>
              <input
                className="contact-input"
                type="text"
                placeholder="Question sur l'abonnement, bug, demande RGPD..."
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>

            <div className="contact-field">
              <label className="contact-label">Message</label>
              <textarea
                className="contact-textarea"
                placeholder="Décrivez votre demande..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            <button className="contact-submit" type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </div>
    </LegalLayout>
  );
};
