import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobBacklogService } from '../services/api';
import type { JobSearch, JobSearchRunResult, JobSource } from '../types';
import { Button } from '../components/atoms/Button';

const pageStyles = `
  .jobsearches-shell { display: flex; flex-direction: column; gap: 24px; padding: 28px 32px 36px; }
  .jobsearches-hero, .jobsearches-panel, .jobsearches-card, .jobsearches-detailCard, .jobsearches-resultCard {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }
  .jobsearches-hero, .jobsearches-panel, .jobsearches-detailCard, .jobsearches-resultCard { padding: 20px; }
  .jobsearches-hero {
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }
  .jobsearches-tabs, .jobsearches-actions, .jobsearches-meta, .jobsearches-row, .jobsearches-filterRow, .jobsearches-detailMeta, .jobsearches-resultMeta {
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
  }
  .jobsearches-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px; padding: 10px 14px; color: var(--text-dim); font-size: 13px; font-weight: 700;
  }
  .jobsearches-tab.is-active { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--text-main); border-color: color-mix(in srgb, var(--accent) 42%, transparent); }
  .jobsearches-layout { display: grid; grid-template-columns: minmax(320px, 420px) minmax(0, 1fr); gap: 20px; align-items: start; }
  .jobsearches-runGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .jobsearches-form { display: flex; flex-direction: column; gap: 12px; }
  .jobsearches-list, .jobsearches-resultList { display: flex; flex-direction: column; gap: 12px; }
  .jobsearches-card { padding: 16px; }
  .jobsearches-card.is-selected { border-color: color-mix(in srgb, var(--accent) 50%, transparent); box-shadow: 0 22px 48px rgba(56, 189, 248, 0.12); }
  .jobsearches-cardHeader { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .jobsearches-detailGrid { margin-top: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .jobsearches-detailBlock {
    min-width: 0; padding: 14px 16px; border-radius: 16px;
    background: color-mix(in srgb, var(--bg-surface) 74%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }
  .jobsearches-detailLabel { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); font-weight: 700; }
  .jobsearches-detailValue { margin-top: 8px; color: var(--text-main); line-height: 1.6; }
  .jobsearches-iconButton { width: 36px; height: 36px; padding: 0; border-radius: 10px; }
  .jobsearches-pill {
    display: inline-flex; align-items: center; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 700;
    background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.22); color: var(--text-main);
  }
  .jobsearches-empty { padding: 36px 16px; text-align: center; color: var(--text-dim); }
  @media (max-width: 1280px) {
    .jobsearches-runGrid { grid-template-columns: 1fr; }
  }
  @media (max-width: 1100px) {
    .jobsearches-layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .jobsearches-shell { padding: 18px; gap: 18px; }
    .jobsearches-detailGrid { grid-template-columns: 1fr; }
  }
`;

const splitCsv = (value: string) => value.split(',').map((part) => part.trim()).filter(Boolean);
const stripHtml = (value: string | null | undefined) => (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value: string, max = 220) => value.length <= max ? value : `${value.slice(0, max).trim()}...`;
const getRunItems = (result: JobSearchRunResult) => result.items.filter((item) => item.run_id === result.run_id);

const IconArrowPath = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6 18 20H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const JobSearchesPage: React.FC = () => {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [sourceFilterId, setSourceFilterId] = useState<number | null>(null);
  const [selectedSearchId, setSelectedSearchId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [lastRunResult, setLastRunResult] = useState<JobSearchRunResult | null>(null);
  const [form, setForm] = useState({
    name: '',
    source_id: '',
    keywords: 'python, fastapi',
    excluded_keywords: 'data analyst',
    locations: 'Paris, Remote',
    contract_type: 'CDI',
    remote_mode: 'ANY',
    profile_summary: 'Backend Python APIs FastAPI product engineering',
    min_score: 60,
  });

  const load = async () => {
    setError(null);
    try {
      const [sourceData, searchData] = await Promise.all([
        jobBacklogService.getSources(),
        jobBacklogService.getSearches(),
      ]);
      setSources(sourceData);
      setSearches(searchData);
      setSelectedSearchId((current) => {
        if (current && searchData.some((search) => search.id === current)) {
          return current;
        }
        return searchData[0]?.id ?? null;
      });
      if (!form.source_id && sourceData.length > 0) {
        setForm((current) => ({ ...current, source_id: String(sourceData[0].id) }));
      }
    } catch {
      setError('Impossible de charger les recherches.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      source_id: sources[0] ? String(sources[0].id) : '',
      keywords: 'python, fastapi',
      excluded_keywords: 'data analyst',
      locations: 'Paris, Remote',
      contract_type: 'CDI',
      remote_mode: 'ANY',
      profile_summary: 'Backend Python APIs FastAPI product engineering',
      min_score: 60,
    });
  };

  const submit = async () => {
    setRunMessage(null);
    const payload = {
      name: form.name,
      source_id: Number(form.source_id),
      keywords: splitCsv(form.keywords),
      excluded_keywords: splitCsv(form.excluded_keywords),
      locations: splitCsv(form.locations),
      contract_type: form.contract_type,
      remote_mode: form.remote_mode,
      profile_summary: form.profile_summary,
      min_score: Number(form.min_score),
    };
    if (editingId) {
      await jobBacklogService.updateSearch(editingId, payload);
    } else {
      await jobBacklogService.createSearch(payload);
    }
    resetForm();
    await load();
  };

  const editSearch = (search: JobSearch) => {
    setRunMessage(null);
    setSelectedSearchId(search.id);
    setEditingId(search.id);
    setForm({
      name: search.name,
      source_id: search.source_id ? String(search.source_id) : '',
      keywords: search.keywords.join(', '),
      excluded_keywords: search.excluded_keywords.join(', '),
      locations: search.locations.join(', '),
      contract_type: search.contract_type,
      remote_mode: search.remote_mode,
      profile_summary: search.profile_summary || '',
      min_score: search.min_score,
    });
  };

  const removeSearch = async (id: number) => {
    setRunMessage(null);
    await jobBacklogService.deleteSearch(id);
    setLastRunResult((current) => current?.search.id === id ? null : current);
    setSelectedSearchId((current) => current === id ? null : current);
    await load();
  };

  const runSearch = async (search: JobSearch) => {
    setError(null);
    setRunMessage(null);
    setSelectedSearchId(search.id);
    setRunningId(search.id);
    try {
      const result = await jobBacklogService.runSearch(search.id);
      const runItems = getRunItems(result);
      const rejectedCount = 0;
      const importedCount = runItems.filter((item) => item.status === 'IMPORTED').length;
      const visibleKnownCount = Math.max(runItems.length - result.created_count, 0);
      setLastRunResult(result);
      setRunMessage(
        `${search.name} · ${result.fetched_count} recuperees · ${result.created_count} nouvelles · ${rejectedCount} hors seuil · ${importedCount} deja importees · ${visibleKnownCount} deja connues`
      );
      await load();
    } catch {
      setError(`Impossible de lancer la recherche "${search.name}".`);
    } finally {
      setRunningId(null);
    }
  };

  const filteredSearches = useMemo(
    () => sourceFilterId ? searches.filter((search) => search.source_id === sourceFilterId) : searches,
    [searches, sourceFilterId]
  );

  const selectedSearch = useMemo(
    () => searches.find((search) => search.id === selectedSearchId) || filteredSearches[0] || null,
    [filteredSearches, searches, selectedSearchId]
  );

  const selectedRunItems = useMemo(
    () => lastRunResult && selectedSearch && lastRunResult.search.id === selectedSearch.id
      ? lastRunResult.items.filter((item) => item.run_id === lastRunResult.run_id)
      : [],
    [lastRunResult, selectedSearch]
  );

  return (
    <div className="jobsearches-shell">
      <style>{pageStyles}</style>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {runMessage ? <div className="alert alert-success">{runMessage}</div> : null}

      <section className="jobsearches-hero">
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>Backlog</span>
        <h1 style={{ margin: '8px 0 0', fontSize: 36, lineHeight: 1.05 }}>Recherches</h1>
        <p style={{ marginTop: 16, color: 'var(--text-dim)', maxWidth: 760 }}>
          Une recherche contient les regles de matching. Elle pointe vers une source et produit ensuite des runs dans le backlog.
        </p>
        <div className="jobsearches-tabs" style={{ marginTop: 18 }}>
          <Link to="/backlog" className="jobsearches-tab">Backlog</Link>
          <Link to="/backlog/sources" className="jobsearches-tab">Sources</Link>
          <Link to="/backlog/searches" className="jobsearches-tab is-active">Recherches</Link>
        </div>
      </section>

      <section className="jobsearches-layout">
        <div className="jobsearches-panel">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>
            {editingId ? 'Editer la recherche' : 'Nouvelle recherche'}
          </div>
          <div className="jobsearches-form" style={{ marginTop: 14 }}>
            <input className="input" placeholder="Nom de la recherche" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <select className="input" value={form.source_id} onChange={(event) => setForm((current) => ({ ...current, source_id: event.target.value }))}>
              <option value="">Choisir une source</option>
              {sources.filter((source) => source.is_enabled).map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
            <input className="input" placeholder="Mots-cles" value={form.keywords} onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))} />
            <input className="input" placeholder="Exclusions" value={form.excluded_keywords} onChange={(event) => setForm((current) => ({ ...current, excluded_keywords: event.target.value }))} />
            <input className="input" placeholder="Lieux" value={form.locations} onChange={(event) => setForm((current) => ({ ...current, locations: event.target.value }))} />
            <textarea className="input" placeholder="Profil" value={form.profile_summary} onChange={(event) => setForm((current) => ({ ...current, profile_summary: event.target.value }))} />
            <div className="jobsearches-row">
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
            <div className="jobsearches-actions">
              <Button variant="primary" onClick={submit}>{editingId ? 'Enregistrer' : 'Creer la recherche'}</Button>
              {editingId ? <Button variant="ghost" onClick={resetForm}>Annuler</Button> : null}
            </div>
          </div>
        </div>

        <div className="jobsearches-panel">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>Recherches configurees</div>
          <div className="jobsearches-filterRow" style={{ marginTop: 14 }}>
            <select className="input" value={sourceFilterId ?? ''} onChange={(event) => setSourceFilterId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Toutes les sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
            <span className="jobsearches-pill">{filteredSearches.length} recherche(s)</span>
          </div>
          <div className="jobsearches-list" style={{ marginTop: 14 }}>
            {filteredSearches.length === 0 ? (
              <div className="jobsearches-empty">Aucune recherche configuree.</div>
            ) : filteredSearches.map((search) => (
              <article key={search.id} className={`jobsearches-card ${selectedSearch?.id === search.id ? 'is-selected' : ''}`}>
                <div className="jobsearches-cardHeader">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{search.name}</div>
                    <div style={{ marginTop: 4, color: 'var(--text-dim)' }}>{search.keywords.join(', ')}</div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedSearchId(search.id)}>Details</Button>
                </div>
                <div className="jobsearches-meta" style={{ marginTop: 12 }}>
                  <span className="jobsearches-pill">{search.source_name || search.source}</span>
                  <span className="jobsearches-pill">{search.contract_type}</span>
                  <span className="jobsearches-pill">{search.remote_mode}</span>
                  <span className="jobsearches-pill">score {search.min_score}</span>
                </div>
                <div style={{ marginTop: 12, color: 'var(--text-dim)' }}>{search.profile_summary || 'Aucun resume de profil.'}</div>
                <div className="jobsearches-actions">
                  <Link to={`/backlog?search_id=${search.id}`}>
                    <Button className="jobsearches-iconButton" variant="ghost" title="Voir dans le backlog" aria-label={`Voir ${search.name} dans le backlog`}>
                      <IconEye />
                    </Button>
                  </Link>
                  <Button
                    className="jobsearches-iconButton"
                    variant="primary"
                    onClick={() => runSearch(search)}
                    disabled={runningId === search.id}
                    title="Lancer la recherche"
                    aria-label={`Lancer la recherche ${search.name}`}
                  >
                    <IconArrowPath />
                  </Button>
                  <Button className="jobsearches-iconButton" variant="ghost" onClick={() => editSearch(search)} title="Editer" aria-label={`Editer ${search.name}`}>
                    <IconEdit />
                  </Button>
                  <Button className="jobsearches-iconButton" variant="secondary" onClick={() => removeSearch(search.id)} title="Supprimer" aria-label={`Supprimer ${search.name}`}>
                    <IconTrash />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="jobsearches-runGrid">
        <div className="jobsearches-detailCard">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>
            Detail de la recherche
          </div>
          {!selectedSearch ? (
            <div className="jobsearches-empty">Selectionne une recherche pour voir ses criteres.</div>
          ) : (
            <>
              <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>{selectedSearch.name}</div>
              <div className="jobsearches-detailMeta" style={{ marginTop: 12 }}>
                <span className="jobsearches-pill">{selectedSearch.source_name || selectedSearch.source}</span>
                <span className="jobsearches-pill">{selectedSearch.contract_type}</span>
                <span className="jobsearches-pill">{selectedSearch.remote_mode}</span>
                <span className="jobsearches-pill">score min {selectedSearch.min_score}</span>
              </div>
              <div className="jobsearches-detailGrid">
                <div className="jobsearches-detailBlock">
                  <div className="jobsearches-detailLabel">Mots-cles</div>
                  <div className="jobsearches-detailValue">{selectedSearch.keywords.join(', ') || 'Aucun mot-cle.'}</div>
                </div>
                <div className="jobsearches-detailBlock">
                  <div className="jobsearches-detailLabel">Exclusions</div>
                  <div className="jobsearches-detailValue">{selectedSearch.excluded_keywords.join(', ') || 'Aucune exclusion.'}</div>
                </div>
                <div className="jobsearches-detailBlock">
                  <div className="jobsearches-detailLabel">Lieux</div>
                  <div className="jobsearches-detailValue">{selectedSearch.locations.join(', ') || 'Tous lieux.'}</div>
                </div>
                <div className="jobsearches-detailBlock">
                  <div className="jobsearches-detailLabel">Profil cible</div>
                  <div className="jobsearches-detailValue">{selectedSearch.profile_summary || 'Aucun resume de profil.'}</div>
                </div>
              </div>
              <div className="jobsearches-actions" style={{ marginTop: 16 }}>
                <Link to={`/backlog?search_id=${selectedSearch.id}`}>
                  <Button variant="ghost">Voir les annonces du backlog</Button>
                </Link>
                <Button variant="primary" onClick={() => runSearch(selectedSearch)} disabled={runningId === selectedSearch.id}>
                  {runningId === selectedSearch.id ? 'Recherche en cours...' : 'Relancer cette recherche'}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="jobsearches-resultCard">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>
            Dernier run visible
          </div>
          {!lastRunResult || !selectedSearch || lastRunResult.search.id !== selectedSearch.id ? (
            <div className="jobsearches-empty">Lance une recherche pour voir le detail du run et les annonces recuperees.</div>
          ) : (
            <>
              <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>
                {lastRunResult.fetched_count} annonces recuperees
              </div>
              <div className="jobsearches-resultMeta" style={{ marginTop: 12 }}>
                <span className="jobsearches-pill">run #{lastRunResult.run_id}</span>
                <span className="jobsearches-pill">{lastRunResult.created_count} nouvelles</span>
                <span className="jobsearches-pill">{selectedRunItems.filter((item) => item.status === 'REJECTED').length} hors seuil</span>
                <span className="jobsearches-pill">{selectedRunItems.filter((item) => item.status === 'IMPORTED').length} deja importees</span>
                <span className="jobsearches-pill">{selectedRunItems.length} affichees</span>
              </div>
              {lastRunResult.error ? (
                <div className="alert alert-error" style={{ marginTop: 14 }}>{lastRunResult.error}</div>
              ) : null}
              <div className="jobsearches-resultList" style={{ marginTop: 14 }}>
                {selectedRunItems.length === 0 ? (
                  <div className="jobsearches-empty">Aucune annonce rattachee a ce run.</div>
                ) : selectedRunItems.map((item) => (
                  <article key={item.id} className="jobsearches-card">
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{item.title}</div>
                    <div style={{ marginTop: 4, color: 'var(--text-dim)' }}>{item.company} · {item.location || 'Lieu inconnu'}</div>
                    <div className="jobsearches-meta" style={{ marginTop: 10 }}>
                      <span className="jobsearches-pill">{item.status}</span>
                      <span className="jobsearches-pill">score {Math.round(item.score)}</span>
                      {item.remote_mode ? <span className="jobsearches-pill">{item.remote_mode}</span> : null}
                    </div>
                    <div style={{ marginTop: 12, color: 'var(--text-dim)' }}>
                      {truncate(stripHtml(item.description), 240) || 'Pas de description disponible.'}
                    </div>
                    <div className="jobsearches-actions" style={{ marginTop: 12 }}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <Button variant="ghost">Voir l'annonce</Button>
                        </a>
                      ) : null}
                      <Link to={`/backlog?search_id=${selectedSearch.id}`}>
                        <Button variant="secondary">Ouvrir dans le backlog</Button>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default JobSearchesPage;
