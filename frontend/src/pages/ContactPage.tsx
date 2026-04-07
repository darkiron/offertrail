import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const pageStyles = `
  .legal-shell { min-height: 100vh; background: var(--bg-base); color: var(--text-main); }
  .legal-nav { position: sticky; top: 0; z-index: 100; backdrop-filter: blur(16px); background: color-mix(in srgb, var(--bg-base) 85%, transparent 15%); border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent 20%); padding: 14px 24px; }
  .legal-nav-inner { max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .legal-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; letter-spacing: .04em; text-decoration: none; color: var(--text-main); }
  .legal-brand-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #38bdf8, #2563eb); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .legal-back { font-size: 13px; color: var(--text-dim); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--border) 70%, transparent); transition: color .15s, background .15s; }
  .legal-back:hover { color: var(--text-main); background: color-mix(in srgb, var(--bg-surface) 50%, transparent); }
  .legal-content { max-width: 800px; margin: 0 auto; padding: 56px 24px 80px; }
  .legal-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 12px; }
  .legal-title { font-size: clamp(26px, 4vw, 38px); font-weight: 900; letter-spacing: -.03em; margin-bottom: 8px; }
  .legal-updated { font-size: 13px; color: var(--text-dim); margin-bottom: 40px; }
  .legal-section { margin-bottom: 36px; padding: 24px 26px; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--border) 80%, transparent); background: var(--bg-mantle); }
  .legal-section h2 { font-size: 15px; font-weight: 800; margin-bottom: 14px; color: var(--text-main); }
  .legal-section p, .legal-section li { font-size: 14px; color: var(--text-dim); line-height: 1.75; }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  .contact-card {
    padding: 20px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    background: color-mix(in srgb, var(--bg-surface) 40%, transparent);
  }

  .contact-card-icon {
    font-size: 20px;
    margin-bottom: 10px;
  }

  .contact-card h3 {
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .contact-card a {
    font-size: 14px;
    color: #38bdf8;
    text-decoration: none;
  }

  .contact-card a:hover { text-decoration: underline; }

  .contact-form {
    display: grid;
    gap: 16px;
  }

  .contact-field {
    display: grid;
    gap: 6px;
  }

  .contact-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
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
    transition: border-color .2s, box-shadow .2s;
    font-family: inherit;
  }

  .contact-input:focus, .contact-textarea:focus {
    border-color: color-mix(in srgb, #38bdf8 72%, white 28%);
    box-shadow: 0 0 0 4px color-mix(in srgb, #38bdf8 16%, transparent);
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
    transition: opacity .15s;
    width: fit-content;
  }

  .contact-submit:hover { opacity: .88; }
  .contact-submit:disabled { opacity: .6; cursor: wait; }

  .contact-success {
    padding: 14px 16px;
    border-radius: 12px;
    background: color-mix(in srgb, #a6e3a1 12%, transparent);
    border: 1px solid color-mix(in srgb, #a6e3a1 30%, transparent);
    color: #a6e3a1;
    font-size: 14px;
  }

  .legal-footer { border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent); background: color-mix(in srgb, var(--bg-crust) 80%, transparent); padding: 28px 24px; text-align: center; }
  .legal-footer-inner { max-width: 800px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px; font-size: 13px; color: var(--text-dim); }
  .legal-footer-inner a { color: var(--text-dim); text-decoration: none; transition: color .15s; }
  .legal-footer-inner a:hover { color: var(--text-main); }

  @media (max-width: 600px) {
    .contact-grid { grid-template-columns: 1fr; }
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
    // Simulation — à brancher sur un endpoint ou service de mail
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="legal-shell">
      <style>{pageStyles}</style>

      <div className="legal-nav">
        <div className="legal-nav-inner">
          <Link to="/" className="legal-brand">
            <div className="legal-brand-mark">OT</div>
            OfferTrail
          </Link>
          <Link to="/" className="legal-back">← Retour à l'accueil</Link>
        </div>
      </div>

      <main className="legal-content">
        <div className="legal-eyebrow">Support &amp; assistance</div>
        <h1 className="legal-title">Nous contacter</h1>
        <p className="legal-updated">Une question, un bug, une demande RGPD ? On vous répond.</p>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-icon">✉️</div>
            <h3>Email direct</h3>
            <a href="mailto:contact@offertrail.fr">contact@offertrail.fr</a>
          </div>
          <div className="contact-card">
            <div className="contact-card-icon">⏱️</div>
            <h3>Délai de réponse</h3>
            <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>Sous 48h ouvrées en général.</p>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                {loading ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <span>© {new Date().getFullYear()} OfferTrail</span>
          <Link to="/legal">Mentions légales</Link>
          <Link to="/cgv">CGV</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
};
