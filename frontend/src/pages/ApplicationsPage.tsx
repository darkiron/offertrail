import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationService, organizationService } from '../services/api';
import type { Application, Organization } from '../types';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import ProbityBadge from '../components/atoms/ProbityBadge';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import StatusBadge, { statusLabelMap } from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import { useI18n } from '../i18n';

const pageStyles = `
  .applications-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }

  .applications-hero,
  .applications-panel,
  .applications-tableWrap {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .applications-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
    gap: 24px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .applications-kicker,
  .applications-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .applications-title {
    margin: 8px 0 0;
    font-size: 36px;
    line-height: 1.05;
  }

  .applications-copy,
  .applications-muted {
    color: var(--text-dim);
    line-height: 1.6;
  }

  .applications-actions,
  .applications-companyTop {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .applications-actions {
    margin-top: 18px;
  }

  .applications-panel {
    padding: 20px;
  }

  .applications-filters {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) 220px auto;
    gap: 14px;
    margin-bottom: 18px;
    align-items: end;
  }

  .applications-check {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 46px;
    color: var(--text-dim);
    font-size: 14px;
  }

  .applications-table {
    width: 100%;
    border-collapse: collapse;
  }

  .applications-table th {
    padding: 14px 16px;
    text-align: left;
    color: var(--text-dim);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid var(--border);
  }

  .applications-table td {
    padding: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    vertical-align: top;
  }

  .applications-table tbody tr:hover td {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .applications-companyCell {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .applications-empty {
    padding: 48px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 1100px) {
    .applications-hero,
    .applications-filters {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .applications-shell {
      padding: 18px;
      gap: 18px;
    }
  }
`;

export const ApplicationsPage: React.FC = () => {
  const { t } = useI18n();
  const [apps, setApps] = useState<Application[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'INTERESTED', label: statusLabelMap.INTERESTED },
    { value: 'APPLIED', label: statusLabelMap.APPLIED },
    { value: 'INTERVIEW', label: statusLabelMap.INTERVIEW },
    { value: 'OFFER', label: statusLabelMap.OFFER },
    { value: 'REJECTED', label: statusLabelMap.REJECTED },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsResponse, orgsData] = await Promise.all([
        applicationService.getApplications({
          search: searchTerm,
          status: statusFilter,
          show_hidden: showHidden ? 'yes' : undefined,
          page,
          limit,
        }),
        organizationService.getAll(),
      ]);
      setApps(appsResponse.items);
      setTotalApps(appsResponse.total);
      setOrganizations(orgsData);
    } catch (fetchError) {
      console.error('Error fetching applications:', fetchError);
      setError('Impossible de charger les candidatures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, showHidden]);

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter, showHidden, page]);

  const orgMap = useMemo(() => new Map(organizations.map((organization) => [organization.id, organization])), [organizations]);

  return (
    <div className="applications-shell">
      <style>{pageStyles}</style>

      {showModal ? <NewApplicationModal onClose={() => setShowModal(false)} onCreated={fetchData} /> : null}

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={fetchData}>{t('common.retry')}</button>
        </div>
      ) : null}

      <section className="applications-hero">
        <div>
          <div className="applications-kicker">◎ {t('nav.applications')}</div>
          <h1 className="applications-title">Candidatures</h1>
          <p className="applications-copy">
            Liste dediee aux candidatures avec badges de statut, filtres simples, et acces direct aux fiches detail.
          </p>
          <div className="applications-actions">
            <Button variant="primary" onClick={() => setShowModal(true)}>{t('dashboard.newApplication')}</Button>
          </div>
        </div>
        <div className="applications-panel">
          <div className="applications-label">Volume</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{totalApps}</div>
          <div className="applications-muted">candidatures dans la liste courante</div>
        </div>
      </section>

      <section className="applications-panel">
        <div className="applications-filters">
          <div>
            <label className="applications-label">{t('dashboard.search')}</label>
            <input
              className="input"
              type="text"
              placeholder="Entreprise, poste, contact..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div>
            <label className="applications-label">{t('dashboard.status')}</label>
            <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <label className="applications-check">
            <input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />
            {t('dashboard.showHidden')}
          </label>
        </div>

        {loading ? (
          <div className="applications-empty">{t('common.loading')}</div>
        ) : (
          <div className="applications-tableWrap">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>{t('dashboard.company')}</th>
                  <th>{t('dashboard.position')}</th>
                  <th>{t('dashboard.status')}</th>
                  <th>{t('dashboard.applied')}</th>
                  <th>{t('dashboard.action')}</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => {
                  const organization = orgMap.get(app.organization_id || -1);
                  return (
                    <tr key={app.id}>
                      <td>
                        <div className="applications-companyCell">
                          <div className="applications-companyTop">
                            <strong>{app.company}</strong>
                            {organization ? <OrganizationTypeBadge type={organization.type} size="xs" /> : null}
                            {organization ? <ProbityBadge score={organization.probity_score} level={organization.probity_level} showScore={false} /> : null}
                          </div>
                          <div className="applications-muted">{app.source || 'Direct'} • {app.type}</div>
                          {app.final_customer_organization_id ? (
                            <div className="applications-muted">
                              Client final: {orgMap.get(app.final_customer_organization_id)?.name || app.final_customer_name || '-'}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td>{app.title}</td>
                      <td><StatusBadge status={app.status} size="md" /></td>
                      <td>{app.applied_at || '-'}</td>
                      <td>
                        <Link to={`/applications/${app.id}`}>
                          <Button variant="ghost" size="small">{t('common.details')}</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="applications-empty">Aucune candidature ne correspond aux filtres.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {totalApps > limit ? (
          <div className="pagination">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              {t('dashboard.previous')}
            </button>
            <div className="pagination-info">
              {t('dashboard.page')} {page} {t('dashboard.of')} {Math.ceil(totalApps / limit)} ({totalApps} {t('dashboard.total')})
            </div>
            <button className="pagination-btn" disabled={page >= Math.ceil(totalApps / limit)} onClick={() => setPage((current) => current + 1)}>
              {t('dashboard.next')}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default ApplicationsPage;
