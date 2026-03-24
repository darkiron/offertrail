import React, { useEffect, useState } from 'react';
import { dashboardService, applicationService } from '../services/api';
import type {Application, DashboardData, MonthlyInsights} from '../types';
import { KPICard } from '../components/molecules/KPICard';
import { Link } from 'react-router-dom';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import MonthlyApplicationsChart from '../components/organisms/MonthlyApplicationsChart';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
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

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const insightsData = await dashboardService.getMonthlyInsights();
      setInsights(insightsData);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      const [dashboardData, appsResponse] = await Promise.all([
        dashboardService.getDashboardData(),
        applicationService.getApplications({ 
          search: searchTerm, 
          status: statusFilter,
          show_hidden: showHidden ? 'yes' : undefined,
          page,
          limit
        })
      ]);
      setData(dashboardData);
      setApps(appsResponse.items);
      setTotalApps(appsResponse.total);
      setFollowups(dashboardData.followups);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
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

  useEffect(() => {
    if (activeTab === 'insights' && !insights) {
      fetchInsights();
    }
  }, [activeTab]);

  const handleMarkFollowup = async (id: number) => {
    try {
      await applicationService.markFollowup(id);
      fetchData();
    } catch (error) {
      console.error('Error marking follow-up as done:', error);
      setError('Failed to update follow-up status.');
    }
  };

  if (loading && !data) return (
    <div className="container mt-lg has-text-centered text-dim" style={{ padding: '4rem' }}>
      <div className="loading-spinner mb-md"></div>
      <p>Loading your dashboard...</p>
    </div>
  );

  const kpis = data?.kpis || {
    total_count: 0,
    active_count: 0,
    due_followups: 0,
    rejected_rate: 0,
    rejected_count: 0,
    response_rate: 0,
    responded_count: 0,
    avg_response_time: null
  };

  return (
    <div className="container mt-lg">
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={fetchData}>Retry</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-lg">
        <h1 className="text-xxl font-bold">🚀 Dashboard</h1>
        <div className="flex gap-md">
          <Link to="/import" className="btn-ghost">📥 Import</Link>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Application</button>
        </div>
      </div>

      {activeTab === 'apps' && apps.length === 0 && !loading && (
        <div className="card has-text-centered" style={{ padding: '4rem' }}>
          <p className="text-lg text-dim mb-md">No applications found.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Add your first application</button>
        </div>
      )}

      {activeTab === 'queue' && followups.length === 0 && !loading && (
        <div className="card has-text-centered" style={{ padding: '4rem' }}>
          <p className="text-lg text-dim">No follow-ups due. Great job! 🎉</p>
        </div>
      )}

      {showModal && (
        <NewApplicationModal 
          onClose={() => setShowModal(false)} 
          onCreated={fetchData} 
        />
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <KPICard label="Total Applications" value={kpis.total_count} />
        <KPICard label="Active Pipeline" value={kpis.active_count} subValue="Ongoing processes" />
        <KPICard label="Due Follow-ups" value={kpis.due_followups} subValue="Requires attention" />
        <KPICard label="Rejected Rate" value={`${kpis.rejected_rate}%`} subValue={`${kpis.rejected_count} total`} />
        <KPICard label="Response Rate" value={`${kpis.response_rate}%`} subValue={`${kpis.responded_count} responses`} />
        <KPICard label="Avg Response Time" value={kpis.avg_response_time ?? '-'} subValue="Days" />
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'apps' ? 'active' : ''}`} onClick={() => setActiveTab('apps')}>Applications</div>
        <div className={`tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>Follow-up Queue</div>
        <div className={`tab ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>Insights</div>
      </div>

      <div className="card">
        {activeTab === 'apps' && (
          <>
            <div className="flex gap-lg items-center mb-lg">
              <div className="flex-grow">
                <label className="text-sm font-bold text-dim mb-xs block">Search</label>
                <input 
                  className="input" 
                  type="text" 
                  placeholder="Company, title, contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ width: '200px' }}>
                <label className="text-sm font-bold text-dim mb-xs block">Status</label>
                <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="APPLIED">APPLIED</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="OFFER">OFFER</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div className="flex items-center gap-sm mt-md">
                <input 
                  type="checkbox" 
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                />
                <span className="text-sm text-dim">Show Rejected/Offer</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Type</th>
                    <th className="has-text-centered">Status</th>
                    <th>Applied</th>
                    <th className="has-text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="font-bold">{app.company}</div>
                        <div className="text-sm text-dim">{app.source || 'Direct'}</div>
                      </td>
                      <td>{app.title}</td>
                      <td>{app.type}</td>
                      <td className="has-text-centered">
                        <span className={`tag status-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="text-sm">{app.applied_at || '-'}</td>
                      <td className="has-text-right">
                        <Link to={`/applications/${app.id}`} className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }}>Details</Link>
                      </td>
                    </tr>
                  ))}
                  {apps.length === 0 && (
                    <tr>
                      <td colSpan={6} className="has-text-centered text-dim" style={{ padding: '4rem' }}>
                        No applications found. Try changing filters or adding a new one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalApps > limit && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <div className="pagination-info">
                  Page {page} of {Math.ceil(totalApps / limit)} ({totalApps} total)
                </div>
                <button 
                  className="pagination-btn" 
                  disabled={page >= Math.ceil(totalApps / limit)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'queue' && (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Next Follow-up</th>
                  <th className="has-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {followups.map(app => (
                  <tr key={app.id}>
                    <td className="font-bold">{app.company}</td>
                    <td>{app.title}</td>
                    <td className="font-bold" style={{ color: 'var(--status-rejected)' }}>{app.next_followup_at}</td>
                    <td className="has-text-right">
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleMarkFollowup(app.id)}
                      >
                        Mark as Done
                      </button>
                    </td>
                  </tr>
                ))}
                {followups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="has-text-centered text-dim" style={{ padding: '4rem' }}>
                      🎉 No follow-ups due! All caught up.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            {loadingInsights ? (
              <div className="has-text-centered text-dim" style={{ padding: '4rem' }}>
                <div className="loading-spinner mb-md"></div>
                <p>Loading insights...</p>
              </div>
            ) : insights ? (
              <MonthlyApplicationsChart data={insights.months} year={insights.year} />
            ) : (
              <div className="has-text-centered text-dim" style={{ padding: '4rem' }}>
                <p className="text-lg italic">Failed to load insights.</p>
                <button className="btn-ghost" onClick={fetchInsights}>Retry</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
