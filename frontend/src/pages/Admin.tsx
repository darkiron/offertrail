import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../services/api';

const adminStyles = `
  .admin-shell {
    max-width: 1240px;
    margin: 0 auto;
    padding: 40px 24px 72px;
    display: grid;
    gap: 24px;
  }

  .admin-hero {
    padding: 28px;
    border-radius: 28px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, #f59e0b 16%, transparent), transparent 30%),
      radial-gradient(circle at bottom left, color-mix(in srgb, var(--accent) 18%, transparent), transparent 32%),
      linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 96%, transparent), color-mix(in srgb, var(--bg-crust) 92%, transparent));
    box-shadow: 0 22px 64px rgba(0, 0, 0, 0.14);
  }

  .admin-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, #f59e0b 15%, transparent);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .admin-title {
    margin: 16px 0 10px;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .admin-copy {
    margin: 0;
    color: var(--text-dim);
    max-width: 48rem;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .admin-card {
    padding: 20px;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 90%, transparent);
  }

  .admin-cardLabel {
    color: var(--text-dim);
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .admin-cardValue {
    margin-top: 10px;
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .admin-panel {
    padding: 22px;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 92%, transparent);
    overflow: hidden;
  }

  .admin-panelHead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .admin-panelTitle {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
  }

  .admin-tableWrap {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 880px;
  }

  .admin-table th,
  .admin-table td {
    padding: 14px 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
    text-align: left;
    vertical-align: top;
  }

  .admin-table th {
    color: var(--text-dim);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .admin-user {
    display: grid;
    gap: 4px;
  }

  .admin-userName {
    font-weight: 700;
  }

  .admin-userMeta {
    color: var(--text-dim);
    font-size: 0.88rem;
  }

  .admin-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: color-mix(in srgb, var(--bg-base) 82%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
  }

  .admin-pill.is-pro {
    background: color-mix(in srgb, #10b981 14%, transparent);
    border-color: color-mix(in srgb, #10b981 32%, transparent);
  }

  .admin-pill.is-admin {
    background: color-mix(in srgb, #f59e0b 14%, transparent);
    border-color: color-mix(in srgb, #f59e0b 28%, transparent);
  }

  .admin-pill.is-disabled {
    background: color-mix(in srgb, #ef4444 12%, transparent);
    border-color: color-mix(in srgb, #ef4444 26%, transparent);
  }

  .admin-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .admin-btn {
    border: none;
    border-radius: 12px;
    padding: 10px 12px;
    font-weight: 700;
    cursor: pointer;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--text-main);
  }

  .admin-btn:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .admin-btn.is-danger {
    background: color-mix(in srgb, #ef4444 16%, transparent);
  }

  .admin-error {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
    background: color-mix(in srgb, #ef4444 10%, transparent);
    color: #fca5a5;
  }

  .admin-empty {
    padding: 32px 20px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 920px) {
    .admin-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .admin-shell {
      padding-inline: 16px;
    }

    .admin-grid {
      grid-template-columns: 1fr;
    }
  }
`;

interface AdminStats {
  total_users: number;
  pro_users: number;
  starter_users: number;
  total_candidatures: number;
  mrr_estimate: number;
}

interface AdminUserRow {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  plan: string;
  role: string;
  is_active: boolean;
  nb_candidatures: number;
  created_at: string | null;
  plan_started_at: string | null;
}

const defaultStats: AdminStats = {
  total_users: 0,
  pro_users: 0,
  starter_users: 0,
  total_candidatures: 0,
  mrr_estimate: 0,
};

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString('fr-FR');
}

export function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => { document.title = 'Administration — OfferTrail'; }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsResponse, usersResponse] = await Promise.all([
          axiosInstance.get<AdminStats>('/admin/stats'),
          axiosInstance.get<AdminUserRow[]>('/admin/users'),
        ]);
        setStats(statsResponse.data);
        setUsers(usersResponse.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setAccessDenied(true);
          window.setTimeout(() => navigate('/', { replace: true }), 1500);
          return;
        }
        setError('Impossible de charger le backoffice admin.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate]);

  const activeUsers = useMemo(
    () => users.filter((user) => user.is_active),
    [users],
  );

  const refreshUsers = async () => {
    const [statsResponse, usersResponse] = await Promise.all([
      axiosInstance.get<AdminStats>('/admin/stats'),
      axiosInstance.get<AdminUserRow[]>('/admin/users'),
    ]);
    setStats(statsResponse.data);
    setUsers(usersResponse.data);
  };

  const handlePlanChange = async (userId: string, plan: 'starter' | 'pro') => {
    try {
      setPendingAction(`${userId}:${plan}`);
      setError(null);
      await axiosInstance.patch(`/admin/users/${userId}/plan`, { plan });
      await refreshUsers();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAccessDenied(true);
        window.setTimeout(() => navigate('/', { replace: true }), 1500);
        return;
      }
      setError("Impossible de mettre à jour l'abonnement.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      setPendingAction(`${userId}:disable`);
      setError(null);
      await axiosInstance.delete(`/admin/users/${userId}`);
      await refreshUsers();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAccessDenied(true);
        window.setTimeout(() => navigate('/', { replace: true }), 1500);
        return;
      }
      setError('Impossible de désactiver cet utilisateur.');
    } finally {
      setPendingAction(null);
    }
  };

  if (accessDenied) {
    return (
      <>
        <style>{adminStyles}</style>
        <section className="admin-shell">
          <div className="admin-error">Accès refusé. Redirection en cours.</div>
        </section>
      </>
    );
  }

  return (
    <>
      <style>{adminStyles}</style>
      <section className="admin-shell">
        <header className="admin-hero">
          <div className="admin-kicker">Admin</div>
          <h1 className="admin-title">Tableau de bord administrateur</h1>
          <p className="admin-copy">
            Vue globale des comptes, du parc d&apos;abonnements et des actions de support.
          </p>
        </header>

        <section className="admin-grid" aria-label="Statistiques globales">
          <article className="admin-card">
            <div className="admin-cardLabel">Users total</div>
            <div className="admin-cardValue">{stats.total_users}</div>
          </article>
          <article className="admin-card">
            <div className="admin-cardLabel">Pro payants</div>
            <div className="admin-cardValue">{stats.pro_users}</div>
          </article>
          <article className="admin-card">
            <div className="admin-cardLabel">MRR estimé</div>
            <div className="admin-cardValue">{stats.mrr_estimate.toFixed(2)} €</div>
          </article>
          <article className="admin-card">
            <div className="admin-cardLabel">Candidatures total</div>
            <div className="admin-cardValue">{stats.total_candidatures}</div>
          </article>
        </section>

        <section className="admin-panel">
          <div className="admin-panelHead">
            <div>
              <h2 className="admin-panelTitle">Liste des utilisateurs</h2>
              <div className="admin-userMeta">{activeUsers.length} actifs sur {users.length} comptes</div>
            </div>
          </div>

          {error ? <div className="admin-error">{error}</div> : null}

          <div className="admin-tableWrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Rôle</th>
                  <th>Candidatures</th>
                  <th>Inscrit le</th>
                  <th>Plan démarré</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-empty">Aucun utilisateur.</td>
                  </tr>
                ) : null}

                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user">
                        <div className="admin-userName">{user.email}</div>
                        <div className="admin-userMeta">
                          {[user.prenom, user.nom].filter(Boolean).join(' ') || 'Profil sans nom'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-pill ${user.plan === 'pro' ? 'is-pro' : ''}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`admin-pill ${user.role === 'admin' ? 'is-admin' : ''}`}>
                          {user.role}
                        </span>
                        {!user.is_active ? <span className="admin-pill is-disabled">désactivé</span> : null}
                      </div>
                    </td>
                    <td>{user.nb_candidatures}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.plan_started_at)}</td>
                    <td>
                      <div className="admin-actions">
                        {user.plan !== 'pro' ? (
                          <button
                            className="admin-btn"
                            type="button"
                            disabled={pendingAction === `${user.id}:pro` || !user.is_active}
                            onClick={() => void handlePlanChange(user.id, 'pro')}
                          >
                            Passer Pro
                          </button>
                        ) : (
                          <button
                            className="admin-btn"
                            type="button"
                            disabled={pendingAction === `${user.id}:starter` || !user.is_active}
                            onClick={() => void handlePlanChange(user.id, 'starter')}
                          >
                            Rétrograder
                          </button>
                        )}
                        <button
                          className="admin-btn is-danger"
                          type="button"
                          disabled={pendingAction === `${user.id}:disable` || !user.is_active}
                          onClick={() => void handleDeactivate(user.id)}
                        >
                          Désactiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </>
  );
}
