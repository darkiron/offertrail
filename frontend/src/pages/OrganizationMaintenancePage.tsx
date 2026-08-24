import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { organizationService } from '../services/api/organizations';
import type { Organization } from '../types';
import classes from './OrganizationMaintenancePage.module.css';
import { ActionButton } from '../components/atoms/Action';
import { SearchField, SelectField, TextAreaField, TextField } from '../components/atoms/FormField';
import { LoadingStatus } from '../components/atoms/LoadingStatus';

type Mode = 'merge' | 'split';
const TYPES: Array<[Organization['type'], string]> = [['CLIENT_FINAL','Client final'],['ESN','ESN'],['CABINET_RECRUTEMENT','Cabinet'],['STARTUP','Startup'],['PME','PME'],['GRAND_COMPTE','Grand compte'],['PORTAGE','Portage'],['AUTRE','Autre']];

function OrganizationPicker({ label, organizations, value, exclude, onChange }: { label: string; organizations: Organization[]; value: string; exclude?: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState('');
  const selected = organizations.find((item) => String(item.id) === value);
  const results = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr');
    if (!needle) return [];
    return organizations.filter((item) => String(item.id) !== exclude && [item.name, item.city, item.website].filter(Boolean).some((field) => String(field).toLocaleLowerCase('fr').includes(needle))).slice(0, 6);
  }, [exclude, organizations, search]);
  if (selected) return <div className={classes.selection}><small>{label}</small><div><span><strong>{selected.name}</strong><em>{selected.city || 'Localisation non renseignée'} · {selected.total_applications ?? 0} candidature(s)</em></span><ActionButton variant="quiet" onClick={() => { onChange(''); setSearch(''); }}>Changer</ActionButton></div></div>;
  return <div className={classes.picker}><SearchField label={label} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom, ville ou site…" autoComplete="off" />{search.trim() && <div className={classes.results}>{results.length ? results.map((item) => <button type="button" key={item.id} onClick={() => { onChange(String(item.id)); setSearch(''); }}><span><strong>{item.name}</strong><small>{item.city || 'Localisation non renseignée'}</small></span><em>{item.total_applications ?? 0} candidature(s)</em></button>) : <p>Aucune entreprise correspondante.</p>}</div>}</div>;
}

export const OrganizationMaintenancePage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('merge');
  const [sourceId, setSourceId] = useState(params.get('source') ?? '');
  const [targetId, setTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [split, setSplit] = useState({ name: '', type: 'AUTRE' as Organization['type'], website: '', notes: '' });

  useEffect(() => { document.title = 'Maintenance entreprises — OfferTrail'; organizationService.getAll().then((items) => setOrganizations(items.sort((a,b) => a.name.localeCompare(b.name)))).catch(() => setError('Impossible de charger les entreprises.')).finally(() => setLoading(false)); }, []);
  const source = organizations.find((item) => String(item.id) === sourceId);
  const target = organizations.find((item) => String(item.id) === targetId);

  const merge = async () => {
    if (!source || !target) return;
    setSubmitting(true); setError(null);
    try { await organizationService.merge(source.id, target.id); navigate(`/app/etablissements/${target.id}`); }
    catch { setError('La fusion a échoué. Aucune donnée n’a été déplacée.'); setConfirming(false); }
    finally { setSubmitting(false); }
  };
  const createSplit = async () => {
    if (!source || !split.name.trim()) return;
    setSubmitting(true); setError(null);
    try { const created = await organizationService.split(source.id, { name: split.name.trim(), type: split.type, website: split.website || null, notes: split.notes || null, move_contacts: true }); navigate(`/app/etablissements/${created.id}`); }
    catch { setError('La scission a échoué. Aucune donnée n’a été déplacée.'); }
    finally { setSubmitting(false); }
  };

  return <main className={classes.page}>
    <Link className={classes.back} to="/app/etablissements">← Entreprises</Link>
    <header className={classes.header}><p className={classes.eyebrow}>Maintenance du référentiel</p><h1>Réparer une fiche entreprise.</h1><p>Fusionnez un doublon ou séparez une fiche composite sans perdre l’historique associé.</p></header>
    <nav className={classes.mode} aria-label="Type d’opération"><button type="button" className={mode === 'merge' ? classes.active : ''} onClick={() => { setMode('merge'); setConfirming(false); }}>Fusionner un doublon</button><button type="button" className={mode === 'split' ? classes.active : ''} onClick={() => { setMode('split'); setConfirming(false); }}>Scinder une fiche</button></nav>
    {error && <p className={classes.error} role="alert">{error}</p>}
    {loading ? <div className={classes.loading}><LoadingStatus>Chargement du référentiel…</LoadingStatus></div> : <div className={classes.layout}>
      <section className={classes.workspace}>
        <div className={classes.fields}><OrganizationPicker label="Fiche source" organizations={organizations} value={sourceId} onChange={(value) => { setSourceId(value); if (value === targetId) setTargetId(''); setConfirming(false); }} />{mode === 'merge' && <OrganizationPicker label="Fiche à conserver" organizations={organizations} value={targetId} exclude={sourceId} onChange={(value) => { setTargetId(value); setConfirming(false); }} />}</div>
        {mode === 'merge' ? <div className={classes.operation}>
          <div className={classes.transfer}><article><small>Source supprimée</small><strong>{source?.name ?? 'À sélectionner'}</strong><span>{source ? `${source.total_applications ?? 0} candidature(s)` : 'Choisissez la fiche en doublon.'}</span></article><b aria-hidden="true">→</b><article><small>Fiche conservée</small><strong>{target?.name ?? 'À sélectionner'}</strong><span>{target ? `${target.total_applications ?? 0} candidature(s)` : 'Choisissez la fiche de référence.'}</span></article></div>
          {!confirming ? <ActionButton variant="primary" disabled={!source || !target} onClick={() => setConfirming(true)}>Vérifier la fusion</ActionButton> : <div className={classes.confirm}><p><strong>Action irréversible.</strong> Les candidatures et contacts de « {source?.name} » seront rattachés à « {target?.name} », puis la source sera supprimée.</p><div><ActionButton onClick={() => setConfirming(false)}>Revenir</ActionButton><ActionButton variant="danger" disabled={submitting} onClick={() => void merge()}>{submitting ? 'Fusion en cours…' : 'Confirmer la fusion'}</ActionButton></div></div>}
        </div> : <div className={classes.operation}>
          <div className={classes.splitForm}><TextField label="Nom de la nouvelle entreprise" value={split.name} onChange={(event) => setSplit((current) => ({ ...current, name: event.target.value }))} placeholder="Nouvelle entité" /><SelectField label="Type" value={split.type} onChange={(event) => setSplit((current) => ({ ...current, type: event.target.value as Organization['type'] }))} options={TYPES} /><TextField label="Site web" type="url" value={split.website} onChange={(event) => setSplit((current) => ({ ...current, website: event.target.value }))} placeholder="https://…" /><TextAreaField className={classes.notes} label="Contexte" rows={4} value={split.notes} onChange={(event) => setSplit((current) => ({ ...current, notes: event.target.value }))} placeholder="Pourquoi cette fiche doit-elle être séparée ?" /></div><p className={classes.notice}>La nouvelle fiche sera créée et les contacts de la source y seront déplacés. Vérifiez d’abord le contenu de la source.</p><ActionButton variant="primary" disabled={!source || !split.name.trim() || submitting} onClick={() => void createSplit()}>{submitting ? 'Scission en cours…' : 'Créer et scinder'}</ActionButton>
        </div>}
      </section>
      <aside><h2>Avant de continuer</h2><dl><div><dt>Fusion</dt><dd>Même entreprise, doublon orthographique ou fiche vide à rattacher.</dd></div><div><dt>Scission</dt><dd>Une fiche mélange plusieurs marques ou structures réellement distinctes.</dd></div><div><dt>Contrôle</dt><dd>Ouvrez la fiche source et vérifiez ses candidatures avant toute opération.</dd></div></dl>{source && <Link to={`/app/etablissements/${source.id}`}>Ouvrir la fiche source →</Link>}</aside>
    </div>}
  </main>;
};

export default OrganizationMaintenancePage;
