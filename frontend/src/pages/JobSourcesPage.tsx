import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobBacklogService } from '../services/api';
import type { JobSource } from '../types';
import { Button } from '../components/atoms/Button';

const pageStyles = `
  .jobsources-shell { display: flex; flex-direction: column; gap: 24px; padding: 28px 32px 36px; }
  .jobsources-hero, .jobsources-panel, .jobsources-card {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }
  .jobsources-hero, .jobsources-panel { padding: 20px; }
  .jobsources-hero {
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }
  .jobsources-tabs, .jobsources-actions, .jobsources-meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .jobsources-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px; padding: 10px 14px; color: var(--text-dim); font-size: 13px; font-weight: 700;
  }
  .jobsources-tab.is-active { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--text-main); border-color: color-mix(in srgb, var(--accent) 42%, transparent); }
  .jobsources-layout { display: grid; grid-template-columns: minmax(320px, 400px) minmax(0, 1fr); gap: 20px; align-items: start; }
  .jobsources-form { display: flex; flex-direction: column; gap: 12px; }
  .jobsources-list { display: flex; flex-direction: column; gap: 12px; }
  .jobsources-card { padding: 16px; }
  .jobsources-iconButton { width: 36px; height: 36px; padding: 0; border-radius: 10px; }
  .jobsources-pill {
    display: inline-flex; align-items: center; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 700;
    background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.22); color: var(--text-main);
  }
  .jobsources-empty { padding: 36px 16px; text-align: center; color: var(--text-dim); }
  @media (max-width: 1100px) { .jobsources-layout { grid-template-columns: 1fr; } }
  @media (max-width: 720px) { .jobsources-shell { padding: 18px; gap: 18px; } }
`;

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

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

const IconArrowUpRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 17 17 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const JobSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    kind: 'rss',
    uri: '',
    feed_key: 'BACKEND',
  });

  const load = async () => {
    setError(null);
    try {
      setSources(await jobBacklogService.getSources());
    } catch {
      setError('Impossible de charger les sources.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', kind: 'rss', uri: '', feed_key: 'BACKEND' });
  };

  const submit = async () => {
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      kind: form.kind,
      uri: form.uri || null,
      config: form.kind === 'rss' ? { feed_key: form.feed_key } : {},
    };
    if (editingId) {
      await jobBacklogService.updateSource(editingId, payload);
    } else {
      await jobBacklogService.createSource(payload);
    }
    resetForm();
    await load();
  };

  const editSource = (source: JobSource) => {
    setEditingId(source.id);
    setForm({
      name: source.name,
      slug: source.slug,
      kind: source.kind,
      uri: source.uri || '',
      feed_key: String(source.config.feed_key || 'BACKEND'),
    });
  };

  const removeSource = async (id: number) => {
    await jobBacklogService.deleteSource(id);
    await load();
  };

  return (
    <div className="jobsources-shell">
      <style>{pageStyles}</style>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="jobsources-hero">
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>Backlog</span>
        <h1 style={{ margin: '8px 0 0', fontSize: 36, lineHeight: 1.05 }}>Sources</h1>
        <p style={{ marginTop: 16, color: 'var(--text-dim)', maxWidth: 760 }}>
          Chaque source represente un point d'entree du backlog. Elle porte un type, une URI explicite et une configuration simple.
        </p>
        <div className="jobsources-tabs" style={{ marginTop: 18 }}>
          <Link to="/backlog" className="jobsources-tab">Backlog</Link>
          <Link to="/backlog/sources" className="jobsources-tab is-active">Sources</Link>
          <Link to="/backlog/searches" className="jobsources-tab">Recherches</Link>
        </div>
      </section>

      <section className="jobsources-layout">
        <div className="jobsources-panel">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>
            {editingId ? 'Editer la source' : 'Nouvelle source'}
          </div>
          <div className="jobsources-form" style={{ marginTop: 14 }}>
            <input className="input" placeholder="Nom de la source" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: slugify(event.target.value) }))} />
            <input className="input" placeholder="slug-source" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            <select className="input" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
              <option value="rss">rss</option>
              <option value="mock">mock</option>
            </select>
            <input className="input" placeholder="URI source" value={form.uri} onChange={(event) => setForm((current) => ({ ...current, uri: event.target.value }))} />
            {form.kind === 'rss' ? (
              <select className="input" value={form.feed_key} onChange={(event) => setForm((current) => ({ ...current, feed_key: event.target.value }))}>
                <option value="PROGRAMMING">PROGRAMMING</option>
                <option value="BACKEND">BACKEND</option>
                <option value="FRONTEND">FRONTEND</option>
                <option value="FULLSTACK">FULLSTACK</option>
                <option value="DEVOPS">DEVOPS</option>
              </select>
            ) : null}
            <div className="jobsources-actions">
              <Button variant="primary" onClick={submit}>{editingId ? 'Enregistrer' : 'Creer la source'}</Button>
              {editingId ? <Button variant="ghost" onClick={resetForm}>Annuler</Button> : null}
            </div>
          </div>
        </div>

        <div className="jobsources-panel">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 700 }}>Sources configurees</div>
          <div className="jobsources-list" style={{ marginTop: 14 }}>
            {sources.length === 0 ? (
              <div className="jobsources-empty">Aucune source configuree.</div>
            ) : sources.map((source) => (
              <article key={source.id} className="jobsources-card">
                <div style={{ fontWeight: 800, fontSize: 20 }}>{source.name}</div>
                <div style={{ marginTop: 4, color: 'var(--text-dim)' }}>{source.slug}</div>
                <div className="jobsources-meta" style={{ marginTop: 12 }}>
                  <span className="jobsources-pill">{source.kind}</span>
                  <span className="jobsources-pill">{source.is_enabled ? 'active' : 'inactive'}</span>
                  {'feed_key' in source.config ? <span className="jobsources-pill">{String(source.config.feed_key)}</span> : null}
                </div>
                {source.uri ? (
                  <div style={{ marginTop: 12 }}>
                    <a href={source.uri} target="_blank" rel="noreferrer">{source.uri}</a>
                  </div>
                ) : <div style={{ marginTop: 12, color: 'var(--text-dim)' }}>Aucune URI definie.</div>}
                <div className="jobsources-actions">
                  {source.uri ? (
                    <a href={source.uri} target="_blank" rel="noreferrer">
                      <Button className="jobsources-iconButton" variant="ghost" title="Ouvrir l'URI" aria-label={`Ouvrir l'URI de ${source.name}`}>
                        <IconArrowUpRight />
                      </Button>
                    </a>
                  ) : null}
                  <Button className="jobsources-iconButton" variant="ghost" onClick={() => editSource(source)} title="Editer" aria-label={`Editer ${source.name}`}>
                    <IconEdit />
                  </Button>
                  {!['mock-board', 'wwr-rss'].includes(source.slug) ? (
                    <Button className="jobsources-iconButton" variant="secondary" onClick={() => removeSource(source.id)} title="Supprimer" aria-label={`Supprimer ${source.name}`}>
                      <IconTrash />
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobSourcesPage;
