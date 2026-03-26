import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobBacklogService } from '../services/api';
import type { JobBacklogItem, JobBacklogRun, JobSearch } from '../types';
import { Button } from '../components/atoms/Button';
import { useI18n } from '../i18n';

const pageStyles = `
  .jobbacklog-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }

  .jobbacklog-hero,
  .jobbacklog-panel,
  .jobbacklog-item,
  .jobbacklog-run,
  .jobbacklog-searchCard {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .jobbacklog-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.85fr);
    gap: 20px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .jobbacklog-grid {
    display: grid;
    grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .jobbacklog-panel {
    padding: 20px;
  }

  .jobbacklog-label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .jobbacklog-copy,
  .jobbacklog-muted,
  .jobbacklog-subtle {
    color: var(--text-dim);
    line-height: 1.6;
  }

  .jobbacklog-subtle {
    font-size: 13px;
  }

  .jobbacklog-actions,
  .jobbacklog-row,
  .jobbacklog-meta,
  .jobbacklog-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .jobbacklog-actions {
    margin-top: 16px;
  }

  .jobbacklog-heroActions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  .jobbacklog-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .jobbacklog-stat {
    padding: 16px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.22);
    border: 1px solid rgba(148, 163, 184, 0.16);
  }

  .jobbacklog-statValue {
    margin-top: 8px;
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
  }

  .jobbacklog-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .jobbacklog-formSection {
    padding: 14px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg-base) 72%, var(--bg-mantle) 28%);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .jobbacklog-searchList,
  .jobbacklog-items,
  .jobbacklog-runs {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .jobbacklog-searchCard,
  .jobbacklog-item,
  .jobbacklog-run {
    padding: 16px;
  }

  .jobbacklog-searchCard {
    width: 100%;
    text-align: left;
    color: inherit;
  }

  .jobbacklog-searchCard.is-active {
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-base) 90%);
  }

  .jobbacklog-pill {
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

  .jobbacklog-score {
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

  .jobbacklog-score.is-mid {
    background: rgba(245, 158, 11, 0.14);
    color: #fbbf24;
  }

  .jobbacklog-score.is-low {
    background: rgba(244, 63, 94, 0.14);
    color: #fb7185;
  }

  .jobbacklog-itemHeader {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .jobbacklog-itemBody {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .jobbacklog-description {
    margin: 0;
    color: var(--text-main);
    line-height: 1.65;
    font-size: 14px;
  }

  .jobbacklog-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .jobbacklog-run {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .jobbacklog-empty {
    padding: 36px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 1100px) {
    .jobbacklog-hero,
    .jobbacklog-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .jobbacklog-shell {
      padding: 18px;
      gap: 18px;
    }

    .jobbacklog-stats {
      grid-template-columns: 1fr;
    }
  }
`;

const splitCsv = (value: string) => value.split(',').map((part) => part.trim()).filter(Boolean);
const stripHtml = (value: string | null | undefined) => (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value: string, max = 320) => value.length <= max ? value : `${value.slice(0, max).trim()}...`;

export const JobBacklogPage: React.FC = () => {
  const { t } = useI18n();
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [items, setItems] = useState<JobBacklogItem[]>([]);
  const [runs, setRuns] = useState<JobBacklogRun[]>([]);
  const [activeSearchId, setActiveSearchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    source: 'mock-board',
    feed_key: 'PROGRAMMING',
    keywords: 'python, fastapi',
    excluded_keywords: 'data analyst',
    locations: 'Paris, Remote',
    contract_type: 'CDI',
    remote_mode: 'ANY',
    profile_summary: 'Backend Python APIs FastAPI product engineering',
    min_score: 60,
  });

  const activeSearch = useMemo(
    () => searches.find((search) => search.id === activeSearchId) || null,
    [searches, activeSearchId],
  );

  const fetchSearches = async () => {
    const searchData = await jobBacklogService.getSearches();
    setSearches(searchData);
    if (!activeSearchId && searchData.length > 0) {
      setActiveSearchId(searchData[0].id);
    }
    return searchData;
  };

  const fetchBacklog = async (searchId: number | null) => {
    if (!searchId) {
      setItems([]);
      setRuns([]);
      return;
    }
    const backlogData = await jobBacklogService.getBacklog({ search_id: searchId });
    setItems(backlogData.items);
    setRuns(backlogData.runs);
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const searchData = await fetchSearches();
      const selectedSearchId = activeSearchId || searchData[0]?.id || null;
      await fetchBacklog(selectedSearchId);
    } catch {
      setError(t('backlog.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchBacklog(activeSearchId).catch(() => setError(t('backlog.loadError')));
    }
  }, [activeSearchId]);

  const createSearch = async () => {
    setError(null);
    try {
      const created = await jobBacklogService.createSearch({
        name: form.name || `Recherche ${new Date().toLocaleTimeString('fr-FR')}`,
        source: form.source,
        source_config: form.source === 'wwr-rss' ? { feed_key: form.feed_key } : {},
        keywords: splitCsv(form.keywords),
        excluded_keywords: splitCsv(form.excluded_keywords),
        locations: splitCsv(form.locations),
        contract_type: form.contract_type,
        remote_mode: form.remote_mode,
        profile_summary: form.profile_summary,
        min_score: Number(form.min_score),
      });
      setActiveSearchId(created.id);
      await refresh();
    } catch {
      setError(t('backlog.createError'));
    }
  };

  const runSearch = async (searchId: number) => {
    setRunning(true);
    setError(null);
    try {
      await jobBacklogService.runSearch(searchId);
      await fetchBacklog(searchId);
    } catch {
      setError(t('backlog.loadError'));
    } finally {
      setRunning(false);
    }
  };

  const importItem = async (itemId: number) => {
    await jobBacklogService.importItem(itemId);
    await fetchBacklog(activeSearchId);
  };

  return (
    <div className="jobbacklog-shell">
      <style>{pageStyles}</style>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="jobbacklog-hero">
        <div>
          <span className="jobbacklog-label">{t('backlog.kicker')}</span>
          <h1 style={{ margin: '8px 0 0', fontSize: 36, lineHeight: 1.05 }}>{t('backlog.title')}</h1>
          <p className="jobbacklog-copy" style={{ marginTop: 16, maxWidth: 720 }}>{t('backlog.copy')}</p>
          <div className="jobbacklog-heroActions">
            {activeSearch ? (
              <Button variant="primary" onClick={() => runSearch(activeSearch.id)} disabled={running}>
                {running ? 'Run en cours...' : t('backlog.runSearch')}
              </Button>
            ) : null}
            <Link to="/applications">
              <Button variant="ghost">Voir les candidatures</Button>
            </Link>
          </div>
        </div>

        <div className="jobbacklog-stats">
          <div className="jobbacklog-stat">
            <span className="jobbacklog-label">Items</span>
            <div className="jobbacklog-statValue">{items.length}</div>
            <div className="jobbacklog-subtle">annonces backlog chargees</div>
          </div>
          <div className="jobbacklog-stat">
            <span className="jobbacklog-label">A traiter</span>
            <div className="jobbacklog-statValue">{items.filter((item) => item.status === 'NEW').length}</div>
            <div className="jobbacklog-subtle">encore a qualifier ou importer</div>
          </div>
        </div>
      </section>

      <section className="jobbacklog-grid">
        <div className="jobbacklog-panel">
          <span className="jobbacklog-label">{t('backlog.createSearch')}</span>
          <div className="jobbacklog-form" style={{ marginTop: 14 }}>
            <div className="jobbacklog-formSection">
              <span className="jobbacklog-label">Source</span>
              <div className="jobbacklog-form" style={{ marginTop: 10 }}>
                <input className="input" placeholder="Nom de la recherche" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                <select className="input" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}>
                  <option value="mock-board">{t('backlog.sourceMock')}</option>
                  <option value="wwr-rss">{t('backlog.sourceWwr')}</option>
                </select>
                {form.source === 'wwr-rss' ? (
                  <select className="input" value={form.feed_key} onChange={(event) => setForm((current) => ({ ...current, feed_key: event.target.value }))}>
                    <option value="PROGRAMMING">PROGRAMMING</option>
                    <option value="BACKEND">BACKEND</option>
                    <option value="FRONTEND">FRONTEND</option>
                    <option value="FULLSTACK">FULLSTACK</option>
                    <option value="DEVOPS">DEVOPS</option>
                  </select>
                ) : null}
              </div>
            </div>

            <div className="jobbacklog-formSection">
              <span className="jobbacklog-label">Matching</span>
              <div className="jobbacklog-form" style={{ marginTop: 10 }}>
                <input className="input" placeholder={t('backlog.keywords')} value={form.keywords} onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))} />
                <input className="input" placeholder={t('backlog.excluded')} value={form.excluded_keywords} onChange={(event) => setForm((current) => ({ ...current, excluded_keywords: event.target.value }))} />
                <input className="input" placeholder={t('backlog.locations')} value={form.locations} onChange={(event) => setForm((current) => ({ ...current, locations: event.target.value }))} />
                <textarea className="input" placeholder={t('backlog.profile')} value={form.profile_summary} onChange={(event) => setForm((current) => ({ ...current, profile_summary: event.target.value }))} />
                <div className="jobbacklog-row">
                  <select className="input" value={form.contract_type} onChange={(event) => setForm((current) => ({ ...current, contract_type: event.target.value }))}>
                    <option value="CDI">CDI</option>
                    <option value="FREELANCE">FREELANCE</option>
                    <option value="ANY">ANY</option>
                  </select>
                  <select className="input" value={form.remote_mode} onChange={(event) => setForm((current) => ({ ...current, remote_mode: event.target.value }))}>
                    <option value="ANY">ANY</option>
                    <option value="REMOTE">REMOTE</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="ONSITE">ONSITE</option>
                  </select>
                  <input className="input" type="number" min={0} max={100} value={form.min_score} onChange={(event) => setForm((current) => ({ ...current, min_score: Number(event.target.value) }))} />
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={createSearch}>{t('backlog.createSearch')}</Button>
          </div>

          <div style={{ marginTop: 26 }}>
            <span className="jobbacklog-label">Recherches</span>
            <div className="jobbacklog-searchList" style={{ marginTop: 12 }}>
              {searches.length === 0 ? (
                <div className="jobbacklog-empty">{t('backlog.noSearches')}</div>
              ) : searches.map((search) => (
                <button
                  key={search.id}
                  type="button"
                  className={`jobbacklog-searchCard ${activeSearchId === search.id ? 'is-active' : ''}`}
                  onClick={() => setActiveSearchId(search.id)}
                >
                  <div style={{ fontWeight: 800 }}>{search.name}</div>
                  <div className="jobbacklog-subtle">{search.keywords.join(', ')}</div>
                  <div className="jobbacklog-actions">
                    <span className="jobbacklog-pill">{search.source}</span>
                    <span className="jobbacklog-pill">{search.contract_type}</span>
                    <span className="jobbacklog-pill">{search.remote_mode}</span>
                    <span className="jobbacklog-pill">{t('backlog.minScore')}: {search.min_score}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="jobbacklog-panel">
            <span className="jobbacklog-label">Annonces</span>
            <div className="jobbacklog-items" style={{ marginTop: 14 }}>
              {loading ? (
                <div className="jobbacklog-empty">Chargement...</div>
              ) : items.length === 0 ? (
                <div className="jobbacklog-empty">{t('backlog.noItems')}</div>
              ) : items.map((item) => {
                const scoreTone = item.score >= 70 ? '' : item.score >= 40 ? 'is-mid' : 'is-low';
                const description = truncate(stripHtml(item.description), 340);
                return (
                  <article key={item.id} className="jobbacklog-item">
                    <div className="jobbacklog-itemHeader">
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 20 }}>{item.title}</div>
                        <div className="jobbacklog-subtle">{item.company} · {item.location || 'Lieu inconnu'} · {item.contract_type || 'Type inconnu'}</div>
                        <div className="jobbacklog-meta" style={{ marginTop: 10 }}>
                          <span className="jobbacklog-pill">{item.source}</span>
                          <span className="jobbacklog-pill">{item.status}</span>
                          {item.remote_mode ? <span className="jobbacklog-pill">{item.remote_mode}</span> : null}
                        </div>
                      </div>
                      <div className={`jobbacklog-score ${scoreTone}`}>{Math.round(item.score)}</div>
                    </div>

                    <div className="jobbacklog-itemBody">
                      <p className="jobbacklog-description">{description || 'Pas de description disponible.'}</p>
                      <div className="jobbacklog-reasons" style={{ marginTop: 12 }}>
                        {item.match_reasons.length > 0 ? item.match_reasons.map((reason) => (
                          <span key={reason} className="jobbacklog-pill">{reason}</span>
                        )) : <span className="jobbacklog-subtle">{t('backlog.reasons')}: -</span>}
                      </div>
                    </div>

                    <div className="jobbacklog-footer">
                      <div className="jobbacklog-subtle">{item.published_at || 'Date inconnue'}</div>
                      <div className="jobbacklog-row">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer">
                            <Button variant="ghost">Voir l'annonce</Button>
                          </a>
                        ) : null}
                        {item.status === 'IMPORTED' && item.imported_application_id ? (
                          <Link to={`/applications/${item.imported_application_id}`}>
                            <Button variant="secondary">{t('backlog.imported')}</Button>
                          </Link>
                        ) : (
                          <Button variant="primary" onClick={() => importItem(item.id)} disabled={item.status !== 'NEW'}>
                            {t('backlog.importItem')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="jobbacklog-panel">
            <span className="jobbacklog-label">Runs</span>
            <div className="jobbacklog-runs" style={{ marginTop: 14 }}>
              {runs.length === 0 ? (
                <div className="jobbacklog-empty">Aucun run pour cette recherche.</div>
              ) : runs.map((run) => (
                <div key={run.id} className="jobbacklog-run">
                  <div>
                    <div style={{ fontWeight: 800 }}>{run.source} · {run.status}</div>
                    <div className="jobbacklog-subtle">fetch {run.fetched_count} · new {run.created_count} · imported {run.imported_count}</div>
                  </div>
                  <div className="jobbacklog-subtle">{new Date(run.created_at).toLocaleString('fr-FR')}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default JobBacklogPage;
