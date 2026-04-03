import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService, applicationService, organizationService, subscriptionService } from '../services/api';
import type { Application, Organization, DashboardData, MonthlyInsights, SubscriptionStatus } from '../types';
import { KPICard } from '../components/molecules/KPICard';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import MonthlyApplicationsChart from '../components/organisms/MonthlyApplicationsChart';
import ProbityBadge from '../components/atoms/ProbityBadge';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import StatusBadge, { statusLabelMap } from '../components/atoms/StatusBadge';
import { Button } from '../components/atoms/Button';
import { useI18n } from '../i18n';
import { PlanLimitBanner } from '../components/PlanLimitBanner';

const pageStyles = `
  .dashboard-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }

  .dashboard-hero,
  .dashboard-panel,
  .dashboard-tableWrap,
  .dashboard-followupCard {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .dashboard-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
    gap: 24px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .dashboard-title {
    margin: 0;
    font-size: 36px;
    line-height: 1.05;
  }

  .dashboard-kicker,
  .dashboard-sectionLabel {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .dashboard-copy {
    margin: 14px 0 0;
    max-width: 720px;
    color: var(--text-dim);
    line-height: 1.6;
  }

  .dashboard-actions,
  .dashboard-tabs,
  .dashboard-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .dashboard-actions {
    margin-top: 20px;
  }

  .dashboard-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dashboard-sideStat {
    padding-bottom: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .dashboard-sideStat:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .dashboard-sideValue {
    margin-top: 8px;
    font-size: 28px;
    line-height: 1;
    font-weight: 700;
  }

  .dashboard-kpis {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 16px;
  }

  .dashboard-panel {
    padding: 20px;
  }

  .dashboard-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px;
    background: transparent;
    color: var(--text-dim);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .dashboard-tab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    color: var(--text-main);
  }

  .dashboard-filters {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) 220px auto;
    gap: 14px;
    margin-bottom: 18px;
    align-items: end;
  }

  .dashboard-check {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 46px;
    color: var(--text-dim);
    font-size: 14px;
  }

  .dashboard-tableWrap {
    overflow-x: auto;
  }

  .dashboard-table {
    width: 100%;
    border-collapse: collapse;
  }

  .dashboard-table th {
    padding: 14px 16px;
    text-align: left;
    color: var(--text-dim);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid var(--border);
  }

  .dashboard-table td {
    padding: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    vertical-align: top;
  }

  .dashboard-table tbody tr:hover td {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .dashboard-companyCell {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dashboard-companyTop {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .dashboard-muted {
    color: var(--text-dim);
    font-size: 14px;
  }

  .dashboard-followupList {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dashboard-followupCard {
    padding: 18px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .dashboard-followupCard:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--accent) 44%, var(--border) 56%);
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.18);
  }

  .dashboard-empty {
    padding: 48px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 1180px) {
    .dashboard-hero,
    .dashboard-filters,
    .dashboard-kpis {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .dashboard-shell {
      padding: 18px;
      gap: 18px;
    }
  }
`;

export const Dashboard: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [followups, setFollowups] = useState<Application[]>([]);
  const [insights, setInsights] = useState<MonthlyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'queue' | 'insights'>('apps');
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'INTERESTED', label: statusLabelMap.INTERESTED },
    { value: 'APPLIED', label: statusLabelMap.APPLIED },
    { value: 'INTERVIEW', label: statusLabelMap.INTERVIEW },
    { value: 'OFFER', label: statusLabelMap.OFFER },
    { value: 'REJECTED', label: statusLabelMap.REJECTED },
  ];

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setError(null);
      const [dashboardData, appsResponse, orgsData, subscriptionData] = await Promise.all([
        dashboardService.getDashboardData(),
        applicationService.getApplications({
          search: searchTerm,
          status: statusFilter,
          page,
          limit,
        }),
        organizationService.getAll(),
        subscriptionService.getMe(),
      ]);
      const includeRejected = showHidden || statusFilter === 'REJECTED';
      const visibleItems = includeRejected
        ? appsResponse.items
        : appsResponse.items.filter((item) => item.status !== 'REJECTED');
      setData(dashboardData);
      setApps(visibleItems);
      setTotalApps(visibleItems.length);
      setFollowups(dashboardData.followups);
      setOrganizations(orgsData);
      setSub(subscriptionData);
    } catch (fetchError: any) {
      if (fetchError.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (fetchError.response?.status === 402) {
        navigate('/pricing?reason=limit_reached');
        return;
      }
      setError('Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const insightsData = await dashboardService.getMonthlyInsights();
      setInsights(insightsData);
    } catch (fetchError: any) {
      if (fetchError.response?.status === 401) {
        navigate('/login');
        return;
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  const orgMap = useMemo(() => new Map(organizations.map((organization) => [organization.id, organization])), [organizations]);

  useEffect(() => {
    document.title = 'Tableau de bord — OfferTrail';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, showHidden]);

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter, showHidden, page]);

  useEffect(() => {
    if (activeTab === 'insights' && !insights) {
      fetchInsights();
    }
  }, [activeTab]);

  const handleMarkFollowup = async (id: number) => {
    try {
      await applicationService.markFollowup(id);
      showToast('Relance mise a jour');
      fetchData();
    } catch (updateError: any) {
      if (updateError.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(updateError.response?.data?.detail || 'Impossible de mettre a jour la relance.');
    }
  };

  const kpis = data?.kpis || {
    total_count: 0,
    active_count: 0,
    due_followups: 0,
    rejected_rate: 0,
    rejected_count: 0,
    response_rate: 0,
    responded_count: 0,
    avg_response_time: null,
  };

  if (loading && !data) {
    return (
      <div className="dashboard-shell">
        <style>{pageStyles}</style>
        <div className="dashboard-panel dashboard-empty">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <style>{pageStyles}</style>

      {showModal ? (
        <NewApplicationModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            showToast('Candidature ajoutee');
            fetchData();
          }}
        />
      ) : null}

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={fetchData}>Retry</button>
        </div>
      ) : null}

      <PlanLimitBanner sub={sub} />
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

      <section className="dashboard-hero">
        <div>
          <div className="dashboard-kicker">{t('dashboard.kicker')}</div>
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
          <p className="dashboard-copy">{t('dashboard.copy')}</p>
          <div className="dashboard-actions">
            <Button variant="primary" onClick={() => setShowModal(true)}>{t('dashboard.newApplication')}</Button>
            <Link to="/import">
              <Button variant="ghost">{t('dashboard.import')}</Button>
            </Link>
          </div>
        </div>
        <div className="dashboard-side">
          <div className="dashboard-sideStat">
            <div className="dashboard-sectionLabel">{t('dashboard.active')}</div>
            <div className="dashboard-sideValue">{kpis.active_count}</div>
            <div className="dashboard-muted">{t('dashboard.activeHint')}</div>
          </div>
          <div className="dashboard-sideStat">
            <div className="dashboard-sectionLabel">{t('dashboard.responses')}</div>
            <div className="dashboard-sideValue">{kpis.response_rate}%</div>
            <div className="dashboard-muted">{kpis.responded_count} {t('dashboard.responsesHint')}</div>
          </div>
          <div className="dashboard-sideStat">
            <div className="dashboard-sectionLabel">{t('dashboard.followups')}</div>
            <div className="dashboard-sideValue">{kpis.due_followups}</div>
            <div className="dashboard-muted">{t('dashboard.followupsHint')}</div>
          </div>
        </div>
      </section>

      <section className="dashboard-kpis">
        <KPICard label={t('dashboard.totalApplications')} value={kpis.total_count} />
        <KPICard label={t('dashboard.activePipeline')} value={kpis.active_count} subValue={t('dashboard.ongoingProcesses')} />
        <KPICard label={t('dashboard.dueFollowups')} value={kpis.due_followups} subValue={t('dashboard.attentionRequired')} />
        <KPICard label={t('dashboard.rejectedRate')} value={`${kpis.rejected_rate}%`} subValue={`${kpis.rejected_count} ${t('dashboard.refusals')}`} />
        <KPICard label={t('dashboard.responseRate')} value={`${kpis.response_rate}%`} subValue={`${kpis.responded_count} ${t('dashboard.responsesCount')}`} />
        <KPICard label={t('dashboard.avgResponseTime')} value={kpis.avg_response_time ?? '-'} subValue={t('dashboard.days')} />
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-tabs">
          <button type="button" className={`dashboard-tab ${activeTab === 'apps' ? 'is-active' : ''}`} onClick={() => setActiveTab('apps')}>
            {t('dashboard.tabApplications')}
          </button>
          <button type="button" className={`dashboard-tab ${activeTab === 'queue' ? 'is-active' : ''}`} onClick={() => setActiveTab('queue')}>
            {t('dashboard.tabFollowups')}
          </button>
          <button type="button" className={`dashboard-tab ${activeTab === 'insights' ? 'is-active' : ''}`} onClick={() => setActiveTab('insights')}>
            {t('dashboard.tabInsights')}
          </button>
        </div>

        {activeTab === 'apps' ? (
          <>
            <div className="dashboard-filters">
              <div>
                <label className="dashboard-sectionLabel">{t('dashboard.search')}</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Entreprise, poste, contact..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div>
                <label className="dashboard-sectionLabel">{t('dashboard.status')}</label>
                <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <label className="dashboard-check">
                <input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />
                {t('dashboard.showHidden')}
              </label>
            </div>

            <div className="dashboard-tableWrap">
              <table className="dashboard-table">
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
                          <div className="dashboard-companyCell">
                            <div className="dashboard-companyTop">
                              <strong>{app.company}</strong>
                              {organization ? <OrganizationTypeBadge type={organization.type} size="xs" /> : null}
                              {organization ? <ProbityBadge score={organization.probity_score} level={organization.probity_level} showScore={false} /> : null}
                            </div>
                            <div className="dashboard-muted">{app.source || t('dashboard.sourceDirect')} • {app.type}</div>
                            {app.final_customer_organization_id ? (
                              <div className="dashboard-muted">
                                Client final: {orgMap.get(app.final_customer_organization_id)?.name || app.final_customer_name || '-'}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td>{app.title}</td>
                        <td><StatusBadge status={app.status} /></td>
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
                      <td colSpan={5} className="dashboard-empty">
                        <div style={{ fontSize: '15px', marginBottom: '8px' }}>Aucune candidature pour l'instant.</div>
                        <div style={{ fontSize: '13px' }}>Commence par en ajouter une.</div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {totalApps > limit ? (
              <div className="pagination">
                <button className="pagination-btn" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </button>
                <div className="pagination-info">
                  Page {page} of {Math.ceil(totalApps / limit)} ({totalApps} total)
                </div>
                <button
                  className="pagination-btn"
                  disabled={page >= Math.ceil(totalApps / limit)}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === 'queue' ? (
          followups.length > 0 ? (
            <div className="dashboard-followupList">
              {followups.map((app) => (
                <div key={app.id} className="dashboard-followupCard" onClick={() => navigate(`/applications/${app.id}`)}>
                  <div>
                    <div className="dashboard-companyTop">
                      <strong>{app.company}</strong>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="dashboard-muted">{app.title}</div>
                    <div className="dashboard-muted">{t('dashboard.nextFollowup')}: {app.next_followup_at || '-'}</div>
                  </div>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMarkFollowup(app.id);
                    }}
                  >
                    {t('dashboard.markDone')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">{t('dashboard.noFollowups')}</div>
          )
        ) : null}

        {activeTab === 'insights' ? (
          loadingInsights ? (
            <div className="dashboard-empty">{t('dashboard.loadingInsights')}</div>
          ) : insights ? (
            <MonthlyApplicationsChart data={insights.months} year={insights.year} />
          ) : (
            <div className="dashboard-empty">
              {t('dashboard.failedInsights')}
              <div style={{ marginTop: 12 }}>
                <Button variant="ghost" size="small" onClick={fetchInsights}>{t('common.retry')}</Button>
              </div>
            </div>
          )
        ) : null}
      </section>
    </div>
  );
};
