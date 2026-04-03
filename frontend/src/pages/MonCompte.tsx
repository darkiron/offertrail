import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, subscriptionService } from '../services/api';
import type { SubscriptionStatus } from '../types';

const pageStyles = `
  .account-shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 32px 24px 56px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .account-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
    gap: 20px;
  }

  .account-card,
  .account-banner {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 24px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 90%, white 10%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .account-card {
    padding: 22px;
  }

  .account-banner {
    padding: 28px;
    background:
      radial-gradient(circle at top left, rgba(16, 185, 129, 0.14), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .account-fieldGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .account-label {
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .account-muted {
    color: var(--text-dim);
    line-height: 1.6;
  }

  .account-modalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.62);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 1200;
  }

  .account-modal {
    width: min(480px, 100%);
    padding: 22px;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), var(--bg-mantle));
  }

  @media (max-width: 860px) {
    .account-grid,
    .account-fieldGrid {
      grid-template-columns: 1fr;
    }
  }
`;

export const MonCompte: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    document.title = 'Mon compte — OfferTrail';
  }, []);

  useEffect(() => {
    subscriptionService.getMe().then(setSub).catch(() => {});
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await authService.updateMe(form);
      setUserData(updated);
      showToast('Profil enregistre');
    } catch (saveError: any) {
      if (saveError.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(saveError.message || 'Impossible de mettre a jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSaving(true);
    setError(null);
    try {
      await authService.changePassword(passwordForm.current_password, passwordForm.new_password);
      showToast('Mot de passe mis a jour');
      setPasswordOpen(false);
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (saveError: any) {
      setError(saveError.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="account-shell">
      <style>{pageStyles}</style>

      {toast ? (
        <div style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 9999,
          padding: '10px 18px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.18)',
          color: '#86efac',
          border: '1px solid rgba(16, 185, 129, 0.34)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {toast}
        </div>
      ) : null}

      <section className="account-banner">
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>
          Mon compte
        </div>
        <h1 style={{ margin: '8px 0 0', fontSize: 38, lineHeight: 1.05 }}>Profil, securite et abonnement au meme endroit.</h1>
        <p className="account-muted" style={{ marginTop: 14 }}>
          Le socle abonnement est pret pour recevoir Mollie sans re-ecriture metier.
        </p>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="account-grid">
        <article className="account-card">
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>
            Profil
          </div>
          <form onSubmit={saveProfile} style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="account-fieldGrid">
              <div>
                <label className="account-label">Prenom</label>
                <input className="input" value={form.prenom} onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))} />
              </div>
              <div>
                <label className="account-label">Nom</label>
                <input className="input" value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))} />
              </div>
            </div>
            <div>
              <label className="account-label">Email</label>
              <input className="input" value={user?.email || ''} disabled />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" style={{ borderRadius: 999, padding: '0.65rem 1rem' }} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button type="button" className="btn-ghost" style={{ borderRadius: 999, padding: '0.65rem 1rem' }} onClick={() => setPasswordOpen(true)}>
                Modifier le mot de passe
              </button>
            </div>
          </form>
        </article>

        <article className="account-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                border: '0.5px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                background: 'var(--bg-base)',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-dim)', margin: '0 0 12px' }}>
                Abonnement
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    background: sub?.is_pro ? 'rgba(34, 197, 94, 0.18)' : 'rgba(148, 163, 184, 0.18)',
                    color: sub?.is_pro ? '#86efac' : 'var(--text-dim)',
                    padding: '2px 10px',
                    borderRadius: '99px',
                  }}
                >
                  {sub?.is_pro ? 'Pro' : 'Starter'}
                </span>
                <button onClick={() => navigate('/pricing')} className="btn-ghost" style={{ fontSize: '12px', borderRadius: 999, padding: '0.35rem 0.7rem' }}>
                  {sub?.is_pro ? 'Gérer' : 'Passer en Pro →'}
                </button>
              </div>

              {sub?.is_pro ? (
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                  Plan démarré le {sub.plan_started_at ? new Date(sub.plan_started_at).toLocaleDateString('fr-FR') : '-'}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 8px' }}>
                    {sub?.candidatures_count ?? 0} / 25 candidatures utilisées
                  </p>
                  <div style={{ height: '4px', background: 'rgba(148, 163, 184, 0.18)', borderRadius: '2px' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '2px',
                        width: `${Math.min(((sub?.candidatures_count ?? 0) / 25) * 100, 100)}%`,
                        background: (sub?.candidatures_count ?? 0) >= 25 ? '#ef4444' : '#0ea5e9',
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                border: '0.5px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                background: 'var(--bg-base)',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-dim)', margin: '0 0 12px' }}>
                Moyen de paiement
              </p>

              {sub?.is_pro ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '24px',
                        borderRadius: '4px',
                        background: 'rgba(148, 163, 184, 0.18)',
                        border: '0.5px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'var(--text-dim)',
                      }}
                    >
                      CB
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                      Disponible après activation Mollie
                    </span>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: '12px', opacity: 0.4, cursor: 'not-allowed', borderRadius: 999, padding: '0.35rem 0.7rem' }} disabled>
                    Modifier
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
                  Aucun moyen de paiement enregistré.
                </p>
              )}
            </div>

            <div
              style={{
                border: '0.5px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                background: 'var(--bg-base)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-dim)', margin: 0 }}>
                  Factures
                </p>
                <button className="btn-ghost" style={{ fontSize: '12px', opacity: 0.4, cursor: 'not-allowed', borderRadius: 999, padding: '0.35rem 0.7rem' }} disabled>
                  Exporter
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500, fontSize: '11px', color: 'var(--text-dim)' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500, fontSize: '11px', color: 'var(--text-dim)' }}>Montant</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500, fontSize: '11px', color: 'var(--text-dim)' }}>Statut</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500, fontSize: '11px', color: 'var(--text-dim)' }}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                      Disponible après activation du paiement Mollie
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      {passwordOpen ? (
        <div className="account-modalOverlay" onClick={() => setPasswordOpen(false)}>
          <div className="account-modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Modifier le mot de passe</h3>
              <button type="button" className="btn-ghost" style={{ borderRadius: 999, padding: '0.5rem 0.8rem' }} onClick={() => setPasswordOpen(false)}>
                Fermer
              </button>
            </div>
            <form onSubmit={changePassword} style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="account-label">Mot de passe actuel</label>
                <input
                  className="input"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                />
              </div>
              <div>
                <label className="account-label">Nouveau mot de passe</label>
                <input
                  className="input"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ borderRadius: 999, padding: '0.65rem 1rem', width: 'fit-content' }} disabled={passwordSaving}>
                {passwordSaving ? 'Mise a jour...' : 'Enregistrer le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
