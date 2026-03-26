import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobBacklogService } from '../services/api';
import type { JobSearch, JobSource } from '../types';
import { Button } from '../components/atoms/Button';

const pageStyles = `
  .jobsearches-shell { display: flex; flex-direction: column; gap: 24px; padding: 28px 32px 36px; }
  .jobsearches-hero, .jobsearches-panel, .jobsearches-card {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }
  .jobsearches-hero, .jobsearches-panel { padding: 20px; }
  .jobsearches-hero {
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }
  .jobsearches-tabs, .jobsearches-actions, .jobsearches-meta, .jobsearches-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .jobsearches-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px; padding: 10px 14px; color: var(--text-dim); font-size: 13px; font-weight: 700;
  }
  .jobsearches-tab.is-active { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--text-main); border-color: color-mix(in srgb, var(--accent) 42%, transparent); }
  .jobsearches-layout { display: grid; grid-template-columns: minmax(320px, 420px) minmax(0, 1fr); gap: 20px; align-items: start; }
  .jobsearches-form { display: flex; flex-direction: column; gap: 12px; }
  .jobsearches-list { display: flex; flex-direction: column; gap: 12px; }
  .jobsearches-card { padding: 16px; }
  .jobsearches-iconButton { width: 36px; height: 36px; padding: 0; border-radius: 10px; }
  .jobsearches-pill {
    display: inline-flex; align-items: center; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 700;
    background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.22); color: var(--text-main);
  }
  .jobsearches-empty { padding: 36px 16px; text-align: center; color: var(--text-dim); }
  @media (max-width: 1100px) { .jobsearches-layout { grid-template-columns: 1fr; } }
  @media (max-width: 720px) { .jobsearches-shell { padding: 18px; gap: 18px; } }
`;

const splitCsv = (value: string) => value.split(',').map((part) => part.trim()).filter(Boolean);

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
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
    await load();
  };

  const runSearch = async (search: JobSearch) => {
    setError(null);
    setRunMessage(null);
    setRunningId(search.id);
    try {
      const result = await jobBacklogService.runSearch(search.id);
      setRunMessage(`${search.name} · ${result.fetched_count} recuperees · ${result.created_count} ajoutees`);
      await load();
    } catch {
      setError(`Impossible de lancer la recherche "${search.name}".`);
    } finally {
      setRunningId(null);
    }
  };

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
          <div className="jobsearches-list" style={{ marginTop: 14 }}>
            {searches.length === 0 ? (
              <div className="jobsearches-empty">Aucune recherche configuree.</div>
            ) : searches.map((search) => (
              <article key={search.id} className="jobsearches-card">
                <div style={{ fontWeight: 800, fontSize: 20 }}>{search.name}</div>
                <div style={{ marginTop: 4, color: 'var(--text-dim)' }}>{search.keywords.join(', ')}</div>
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
    </div>
  );
};

export default JobSearchesPage;
