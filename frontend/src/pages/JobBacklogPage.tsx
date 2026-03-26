import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobBacklogService } from '../services/api';
import type { JobBacklogItem, JobBacklogRun, JobSearch, JobSource } from '../types';
import { Button } from '../components/atoms/Button';

const pageStyles = `
  .backlog-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }
  .backlog-hero,
  .backlog-panel,
  .backlog-item,
  .backlog-run {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }
  .backlog-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.85fr);
    gap: 20px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }
  .backlog-panel { padding: 20px; }
  .backlog-label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }
  .backlog-muted, .backlog-copy {
    color: var(--text-dim);
    line-height: 1.6;
  }
  .backlog-tabs, .backlog-filters, .backlog-meta, .backlog-actions, .backlog-reasons, .backlog-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .backlog-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px;
    padding: 10px 14px;
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 700;
  }
  .backlog-tab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--text-main);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  }
  .backlog-filterHeader {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .backlog-filterGrid {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .backlog-filterField {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .backlog-filterField label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }
  .backlog-stats { margin-top: 18px; }
  .backlog-stat {
    min-width: 150px;
    padding: 14px 16px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }
  .backlog-statValue {
    font-size: 28px;
    line-height: 1;
    font-weight: 800;
    color: var(--text-main);
  }
  .backlog-filters { margin-top: 14px; }
  .backlog-item, .backlog-run { padding: 16px; }
  .backlog-items, .backlog-runs { display: flex; flex-direction: column; gap: 12px; }
  .backlog-itemHeader {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }
  .backlog-score {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    height: 44px;
    padding: 0 12px;
    border-radius: 14px;
    font-weight: 800;
    background: rgba(16, 185, 129, 0.14);
    color: #34d399;
  }
  .backlog-score.is-mid { background: rgba(245, 158, 11, 0.14); color: #fbbf24; }
  .backlog-score.is-low { background: rgba(244, 63, 94, 0.14); color: #fb7185; }
  .backlog-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 700;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.22);
    color: var(--text-main);
  }
  .backlog-itemBody {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }
  .backlog-description {
    margin: 0;
    color: var(--text-main);
    line-height: 1.65;
    font-size: 14px;
  }
  .backlog-footer {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .backlog-empty {
    padding: 36px 16px;
    text-align: center;
    color: var(--text-dim);
  }
  @media (max-width: 1100px) {
    .backlog-hero {
      grid-template-columns: 1fr;
    }
    .backlog-filterGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 720px) {
    .backlog-shell {
      padding: 18px;
      gap: 18px;
    }
    .backlog-filterGrid {
      grid-template-columns: 1fr;
    }
  }
`;

const stripHtml = (value: string | null | undefined) => (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value: string, max = 320) => value.length <= max ? value : `${value.slice(0, max).trim()}...`;

export const JobBacklogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sources, setSources] = useState<JobSource[]>([]);
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [items, setItems] = useState<JobBacklogItem[]>([]);
  const [runs, setRuns] = useState<JobBacklogRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeSearchId = searchParams.get('search_id') ? Number(searchParams.get('search_id')) : null;
  const activeSourceId = searchParams.get('source_id') ? Number(searchParams.get('source_id')) : null;
  const statusFilter = searchParams.get('status') || '';
  const activeSearch = useMemo(() => searches.find((search) => search.id === activeSearchId) || null, [searches, activeSearchId]);
  const activeSource = useMemo(() => sources.find((source) => source.id === activeSourceId) || null, [sources, activeSourceId]);
  const importedCount = items.filter((item) => item.status === 'IMPORTED').length;
  const rejectedCount = items.filter((item) => item.status === 'REJECTED').length;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sourceData, searchData, backlogData] = await Promise.all([
        jobBacklogService.getSources(),
        jobBacklogService.getSearches(),
        jobBacklogService.getBacklog({
          source_id: activeSourceId || undefined,
          search_id: activeSearchId || undefined,
          status: statusFilter || undefined,
        }),
      ]);
      setSources(sourceData);
      setSearches(searchData);
      setItems(backlogData.items);
      setRuns(backlogData.runs);
    } catch {
      setError('Impossible de charger le backlog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [activeSearchId, activeSourceId, statusFilter]);

  const updateFilters = (next: { source_id?: number | null; search_id?: number | null; status?: string | null }) => {
    const params = new URLSearchParams(searchParams);
    const entries = Object.entries(next);
    for (const [key, value] of entries) {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    setSearchParams(params);
  };

  const importItem = async (itemId: number) => {
    await jobBacklogService.importItem(itemId);
    await refresh();
  };

  const visibleSearches = activeSourceId
    ? searches.filter((search) => search.source_id === activeSourceId)
    : searches;

  return (
    <div className="backlog-shell">
      <style>{pageStyles}</style>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="backlog-hero">
        <div>
          <span className="backlog-label">Backlog</span>
          <h1 style={{ margin: '8px 0 0', fontSize: 36, lineHeight: 1.05 }}>Annonces qualifiees</h1>
          <p className="backlog-copy" style={{ marginTop: 16, maxWidth: 720 }}>
            Le backlog sert maintenant uniquement a lire, filtrer et convertir les annonces. La configuration des sources et des recherches est geree sur des ecrans distincts.
          </p>
          <div className="backlog-tabs" style={{ marginTop: 20 }}>
            <Link to="/backlog" className="backlog-tab is-active">Backlog</Link>
            <Link to="/backlog/sources" className="backlog-tab">Sources</Link>
            <Link to="/backlog/searches" className="backlog-tab">Recherches</Link>
          </div>
          <div className="backlog-actions">
            <Link to="/backlog/sources"><Button variant="ghost">Gerer les sources</Button></Link>
            <Link to="/backlog/searches"><Button variant="ghost">Gerer les recherches</Button></Link>
          </div>
        </div>

        <div className="backlog-panel">
          <span className="backlog-label">Vue rapide</span>
          <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800 }}>{items.length}</div>
          <div className="backlog-muted">annonces visibles selon les filtres</div>
          <div style={{ marginTop: 18, fontSize: 30, fontWeight: 800 }}>{items.filter((item) => item.status === 'NEW').length}</div>
          <div className="backlog-muted">annonces encore a importer</div>
        </div>
      </section>

      <section className="backlog-panel">
        <div className="backlog-filterHeader">
          <div>
            <span className="backlog-label">Filtres</span>
            <p className="backlog-copy" style={{ margin: '10px 0 0', maxWidth: 760 }}>
              Isole le backlog par source, recherche ou statut. Les filtres pilotent maintenant aussi la liste des runs.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setSearchParams(new URLSearchParams())}>Reset</Button>
        </div>
        <div className="backlog-filterGrid">
          <div className="backlog-filterField">
            <label htmlFor="backlog-source-filter">Source</label>
            <select
              id="backlog-source-filter"
              className="input"
              value={activeSourceId ?? ''}
              onChange={(event) => {
                const nextSourceId = event.target.value ? Number(event.target.value) : null;
                updateFilters({ source_id: nextSourceId, search_id: null });
              }}
            >
              <option value="">Toutes les sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </div>
          <div className="backlog-filterField">
            <label htmlFor="backlog-search-filter">Recherche</label>
            <select
              id="backlog-search-filter"
              className="input"
              value={activeSearchId ?? ''}
              onChange={(event) => updateFilters({ search_id: event.target.value ? Number(event.target.value) : null })}
            >
              <option value="">Toutes les recherches</option>
              {visibleSearches.map((search) => (
                <option key={search.id} value={search.id}>{search.name}</option>
              ))}
            </select>
          </div>
          <div className="backlog-filterField">
            <label htmlFor="backlog-status-filter">Statut</label>
            <select
              id="backlog-status-filter"
              className="input"
              value={statusFilter}
              onChange={(event) => updateFilters({ status: event.target.value || null })}
            >
              <option value="">Tous les statuts</option>
              <option value="NEW">NEW</option>
              <option value="IMPORTED">IMPORTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="backlog-filterField">
            <label>Contexte</label>
            <div className="backlog-filters">
              <span className="backlog-pill">{activeSource ? activeSource.name : 'Toutes sources'}</span>
              <span className="backlog-pill">{activeSearch ? activeSearch.name : 'Toutes recherches'}</span>
              <span className="backlog-pill">{statusFilter || 'Tous statuts'}</span>
            </div>
          </div>
        </div>
        <div className="backlog-stats">
          <div className="backlog-stat">
            <div className="backlog-statValue">{items.length}</div>
            <div className="backlog-muted">visibles</div>
          </div>
          <div className="backlog-stat">
            <div className="backlog-statValue">{items.filter((item) => item.status === 'NEW').length}</div>
            <div className="backlog-muted">a trier</div>
          </div>
          <div className="backlog-stat">
            <div className="backlog-statValue">{importedCount}</div>
            <div className="backlog-muted">importees</div>
          </div>
          <div className="backlog-stat">
            <div className="backlog-statValue">{rejectedCount}</div>
            <div className="backlog-muted">rejetees</div>
          </div>
        </div>
        {activeSearch ? (
          <div className="backlog-actions" style={{ marginTop: 18 }}>
            <span className="backlog-pill">{activeSearch.source_name || activeSearch.source}</span>
            <span className="backlog-pill">{activeSearch.keywords.join(', ')}</span>
          </div>
        ) : null}
      </section>

      <section className="backlog-panel">
        <span className="backlog-label">Annonces</span>
        <div className="backlog-items" style={{ marginTop: 14 }}>
          {loading ? (
            <div className="backlog-empty">Chargement...</div>
          ) : items.length === 0 ? (
            <div className="backlog-empty">Aucune annonce ne correspond aux filtres courants.</div>
          ) : items.map((item) => {
            const scoreTone = item.score >= 70 ? '' : item.score >= 40 ? 'is-mid' : 'is-low';
            const description = truncate(stripHtml(item.description), 340);
            return (
              <article key={item.id} className="backlog-item">
                <div className="backlog-itemHeader">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{item.title}</div>
                    <div className="backlog-muted">{item.company} · {item.location || 'Lieu inconnu'} · {item.contract_type || 'Type inconnu'}</div>
                    <div className="backlog-meta" style={{ marginTop: 10 }}>
                      <span className="backlog-pill">{item.source}</span>
                      <span className="backlog-pill">{item.status}</span>
                      {item.remote_mode ? <span className="backlog-pill">{item.remote_mode}</span> : null}
                    </div>
                  </div>
                  <div className={`backlog-score ${scoreTone}`}>{Math.round(item.score)}</div>
                </div>
                <div className="backlog-itemBody">
                  <p className="backlog-description">{description || 'Pas de description disponible.'}</p>
                  <div className="backlog-reasons" style={{ marginTop: 12 }}>
                    {item.match_reasons.map((reason) => (
                      <span key={reason} className="backlog-pill">{reason}</span>
                    ))}
                  </div>
                </div>
                <div className="backlog-footer">
                  <div className="backlog-muted">{item.published_at || 'Date inconnue'}</div>
                  <div className="backlog-actions" style={{ marginTop: 0 }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <Button variant="ghost">Voir l'annonce</Button>
                      </a>
                    ) : null}
                    {item.status === 'IMPORTED' && item.imported_application_id ? (
                      <Link to={`/applications/${item.imported_application_id}`}>
                        <Button variant="secondary">Importe</Button>
                      </Link>
                    ) : (
                      <Button variant="primary" onClick={() => importItem(item.id)} disabled={item.status !== 'NEW'}>
                        Importer en interested
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="backlog-panel">
        <span className="backlog-label">Runs</span>
        <div className="backlog-runs" style={{ marginTop: 14 }}>
          {runs.length === 0 ? (
            <div className="backlog-empty">Aucun run pour les filtres courants.</div>
          ) : runs.map((run) => (
            <div key={run.id} className="backlog-run">
              <div>
                <div style={{ fontWeight: 800 }}>{run.source} · {run.status}</div>
                <div className="backlog-muted">fetch {run.fetched_count} · new {run.created_count} · imported {run.imported_count}</div>
              </div>
              <div className="backlog-muted">{new Date(run.created_at).toLocaleString('fr-FR')}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default JobBacklogPage;
