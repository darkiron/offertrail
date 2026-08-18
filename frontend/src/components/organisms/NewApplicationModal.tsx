import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { applicationService, organizationService, type WorkflowOrganization } from '../../services/api';
import classes from './NewApplicationModal.module.css';

interface NewApplicationModalProps { onClose: () => void; onCreated: () => void; }

export function NewApplicationModal({ onClose, onCreated }: NewApplicationModalProps) {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<WorkflowOrganization[]>([]);
  const [poste, setPoste] = useState('');
  const [company, setCompany] = useState('');
  const [finalCustomer, setFinalCustomer] = useState('');
  const [status, setStatus] = useState('envoyee');
  const [contractType, setContractType] = useState('');
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [nextAction, setNextAction] = useState('');
  const [source, setSource] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { organizationService.getWorkflowAll().then(setOrganizations).catch(() => setError('Impossible de charger les entreprises.')); }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [loading, onClose]);

  const suggestions = useMemo(() => {
    const needle = company.trim().toLocaleLowerCase('fr');
    return organizations.filter((organization) => !needle || organization.nom.toLocaleLowerCase('fr').includes(needle)).slice(0, 8);
  }, [company, organizations]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!poste.trim() || !company.trim()) return;
    setLoading(true); setError(null);
    try {
      let organization = organizations.find((item) => item.nom.localeCompare(company.trim(), 'fr', { sensitivity: 'base' }) === 0);
      if (!organization) organization = await organizationService.createWorkflow({ nom: company.trim(), type: 'AUTRE' });
      let finalCustomerOrganization = finalCustomer.trim()
        ? organizations.find((item) => item.nom.localeCompare(finalCustomer.trim(), 'fr', { sensitivity: 'base' }) === 0)
        : undefined;
      if (finalCustomer.trim() && !finalCustomerOrganization) {
        finalCustomerOrganization = await organizationService.createWorkflow({ nom: finalCustomer.trim(), type: 'AUTRE' });
      }
      const application = await applicationService.createWorkflowApplication({
        etablissement_id: organization.id,
        client_final_id: finalCustomerOrganization?.id ?? null,
        poste: poste.trim(), statut: status,
        date_candidature: appliedAt ? new Date(`${appliedAt}T12:00:00`).toISOString() : null,
        source: source.trim() || null, url_offre: jobUrl.trim() || null,
        type_contrat: contractType || null,
      });
      if (nextAction) await applicationService.scheduleWorkflowAction(application.id, { due_at: new Date(`${nextAction}T12:00:00`).toISOString(), channel: 'email' });
      onCreated();
    } catch (caught: unknown) {
      if (axios.isAxiosError(caught) && caught.response?.status === 402) { onClose(); navigate('/app/mon-compte?reason=limit_reached'); return; }
      if (axios.isAxiosError(caught) && caught.response?.status === 401) { onClose(); navigate('/login'); return; }
      setError(axios.isAxiosError(caught) ? (caught.response?.data?.detail ?? 'Impossible de créer la candidature.') : 'Impossible de créer la candidature.');
    } finally { setLoading(false); }
  };

  return <div className={classes.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
    <section className={classes.dialog} role="dialog" aria-modal="true" aria-labelledby="new-application-title">
      <header><div><p>Nouvelle opportunité</p><h2 id="new-application-title">Ajouter une candidature</h2></div><button type="button" aria-label="Fermer" onClick={onClose}>×</button></header>
      <form onSubmit={submit}>
        <div className={classes.core}>
          <label><span className={classes.labelText}>Poste <b>*</b></span><input autoFocus required value={poste} onChange={(event) => setPoste(event.target.value)} placeholder="Product Designer" /></label>
          <label className={classes.companyField}><span className={classes.labelText}>Entreprise <b>*</b></span><input required value={company} onFocus={() => setSuggestionsOpen(true)} onChange={(event) => { setCompany(event.target.value); setSuggestionsOpen(true); }} placeholder="Atelier Noma" autoComplete="off" />{suggestionsOpen && company.trim() && suggestions.length > 0 && <div className={classes.suggestions}>{suggestions.map((organization) => <button type="button" key={organization.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setCompany(organization.nom); setSuggestionsOpen(false); }}><strong>{organization.nom}</strong><span>{organization.type.replaceAll('_', ' ').toLowerCase()}</span></button>)}</div>}<small>{company && !organizations.some((item) => item.nom.localeCompare(company.trim(), 'fr', { sensitivity: 'base' }) === 0) ? `Nouvelle entreprise : « ${company} »` : 'Recherchez une entreprise existante ou créez-la en saisissant son nom.'}</small></label>
          <label><span className={classes.labelText}>Client final <em>si connu</em></span><input list="final-customer-organizations" value={finalCustomer} onChange={(event) => setFinalCustomer(event.target.value)} placeholder="Entreprise où la mission aura lieu" autoComplete="off" /><datalist id="final-customer-organizations">{organizations.filter((item) => item.nom !== company).map((item) => <option key={item.id} value={item.nom} />)}</datalist><small>À renseigner lorsque l’entreprise ci-dessus est une ESN, un cabinet ou un intermédiaire.</small></label>
          <div className={classes.split}><label><span className={classes.labelText}>Statut</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="en_attente">À préparer</option><option value="envoyee">Envoyée</option><option value="entretien">Entretien</option><option value="offre_recue">Offre reçue</option></select></label><label><span className={classes.labelText}>Type de contrat</span><select value={contractType} onChange={(event) => setContractType(event.target.value)}><option value="">Non renseigné</option><option value="cdi">CDI</option><option value="cdd">CDD</option><option value="freelance">Freelance</option><option value="stage">Stage</option><option value="alternance">Alternance</option><option value="autre">Autre</option></select></label></div><label><span className={classes.labelText}>Date de candidature</span><input type="date" value={appliedAt} onChange={(event) => setAppliedAt(event.target.value)} /></label>
          <label className={classes.next}><span className={classes.labelText}>Prochaine relance <em>facultative</em></span><input type="date" value={nextAction} min={appliedAt || undefined} onChange={(event) => setNextAction(event.target.value)} /><small>Vous pourrez aussi la planifier plus tard depuis le dossier.</small></label>
        </div>
        <button className={classes.detailsToggle} type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}>{detailsOpen ? 'Masquer les détails' : 'Ajouter des détails'} <span>{detailsOpen ? '−' : '+'}</span></button>
        {detailsOpen && <div className={classes.details}><label><span className={classes.labelText}>Source</span><input value={source} onChange={(event) => setSource(event.target.value)} placeholder="LinkedIn, Welcome to the Jungle…" /></label><label><span className={classes.labelText}>Lien de l’offre</span><input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://…" /></label></div>}
        {error && <p className={classes.error} role="alert">{error}</p>}
        <footer><button type="button" onClick={onClose} disabled={loading}>Annuler</button><button type="submit" disabled={loading || !poste.trim() || !company.trim()}>{loading ? 'Création…' : nextAction ? 'Créer et planifier la suite' : 'Créer la candidature'}</button></footer>
      </form>
    </section>
  </div>;
}
