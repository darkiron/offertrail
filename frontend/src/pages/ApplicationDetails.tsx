import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { applicationService, dashboardService } from '../services/api';
import classes from './ApplicationDetails.module.css';
import { ActionButton, ExternalAction } from '../components/atoms/Action';
import { SelectField, TextAreaField, TextField } from '../components/atoms/FormField';
import { LoadingStatus } from '../components/atoms/LoadingStatus';
import { DetailSummary } from '../components/molecules/DetailSummary';
import { DetailHeader } from '../components/organisms/DetailHeader';
import { Dialog } from '../components/molecules/Dialog';
import { WorkflowApplicationEditModal } from '../components/organisms/WorkflowApplicationEditModal';
import { EntityLink } from '../components/atoms/EntityLink';

const STATUS_LABELS: Record<string, string> = { en_attente: 'À préparer', envoyee: 'Envoyée', entretien: 'Entretien', offre_recue: 'Offre reçue', refusee: 'Refusée' };
const EVENT_LABELS: Record<string, string> = { creation: 'Candidature créée', modification: 'Dossier mis à jour', changement_statut: 'Statut modifié', note: 'Note ajoutée', relance: 'Relance', followup_completed: 'Relance réalisée' };
const CONTRACT_LABELS: Record<string,string> = {cdi:'CDI',cdd:'CDD',freelance:'Freelance',stage:'Stage',alternance:'Alternance',autre:'Autre'};

function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value));
}

export function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showComplete, setShowComplete] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [outcome, setOutcome] = useState('no_response');
  const [note, setNote] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [channel, setChannel] = useState('email');
  const [editing, setEditing] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const navigationState = location.state as { from?: string; scrollY?: number } | null;
  const from = navigationState?.from ?? '/app/candidatures';
  const query = useQuery({ queryKey: ['application-workspace', id], queryFn: () => applicationService.getWorkspace(id!), enabled: Boolean(id) });
  const complete = useMutation({
    mutationFn: () => dashboardService.completeAction(query.data!.next_action!.id, { outcome, note: note.trim() || undefined }),
    onSuccess: async () => {
      setShowComplete(false); setNote('');
      await Promise.all([query.refetch(), queryClient.invalidateQueries({ queryKey: ['today'] }), queryClient.invalidateQueries({ queryKey: ['workflow-applications'] })]);
    },
  });
  const schedule = useMutation({
    mutationFn: () => applicationService.scheduleWorkflowAction(id!, { due_at: new Date(`${dueAt}T12:00:00`).toISOString(), channel }),
    onSuccess: async () => {
      setShowSchedule(false); setDueAt('');
      await Promise.all([query.refetch(), queryClient.invalidateQueries({ queryKey: ['today'] }), queryClient.invalidateQueries({ queryKey: ['workflow-applications'] })]);
    },
  });
  const addNote = useMutation({ mutationFn:()=>applicationService.addWorkflowNote(id!,newNote.trim()), onSuccess:async()=>{setShowNote(false);setNewNote('');await query.refetch();} });

  if (query.error && (query.error as { response?: { status?: number } }).response?.status === 401) {
    navigate(`/login?next=${encodeURIComponent(location.pathname)}`); return null;
  }
  if (query.isLoading) return <main className={classes.page}><div className={classes.loading}><LoadingStatus>Ouverture du dossier…</LoadingStatus></div></main>;
  if (!query.data) return <main className={classes.page}><div className={classes.empty}><h1>Dossier introuvable</h1><Link to={from}>Retour aux candidatures</Link></div></main>;

  const { application, organization, final_customer: finalCustomer, contacts, next_action: nextAction, timeline } = query.data;
  const primaryContact = contacts[0];
  const currentDetailPath = `${location.pathname}${location.search}`;
  return (
    <main className={classes.page}>
      {editing&&<WorkflowApplicationEditModal workspace={query.data} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);void Promise.all([query.refetch(),queryClient.invalidateQueries({queryKey:['today']}),queryClient.invalidateQueries({queryKey:['workflow-applications']})]);}}/>}
      <DetailHeader backTo={from} backLabel="Toutes les candidatures" backState={{restoreScrollY:navigationState?.scrollY}} eyebrow="Dossier de candidature" title={application.poste} subtitle={organization.name} badges={<span>{STATUS_LABELS[application.statut]??application.statut}</span>} actions={<><ActionButton variant="primary" onClick={()=>setEditing(true)}>Modifier le dossier</ActionButton>{application.url_offre&&<ExternalAction href={application.url_offre}>Voir l’offre ↗</ExternalAction>}</>}/>
      <DetailSummary label="Synthèse de la candidature" items={[{label:'Contrat',value:application.type_contrat?CONTRACT_LABELS[application.type_contrat]??application.type_contrat:'Non renseigné'},{label:application.type_contrat==='freelance'?'TJM visé':'Salaire brut annuel',value:application.type_contrat==='freelance'?(application.tjm_vise?`${application.tjm_vise.toLocaleString('fr-FR')} € / jour`:'Non renseigné'):(application.salaire_vise?`${application.salaire_vise.toLocaleString('fr-FR')} €`:'Non renseigné')},{label:'Candidaté le',value:formatDate(application.date_candidature)},{label:'Entreprise',value:<EntityLink to={`/app/etablissements/${organization.id}`} from={currentDetailPath}>{organization.name}</EntityLink>},{label:'Client final',value:finalCustomer?<EntityLink to={`/app/etablissements/${finalCustomer.id}`} from={currentDetailPath}>{finalCustomer.name}</EntityLink>:'Non renseigné'}]}/>

      <section className={nextAction ? classes.nextAction : classes.noAction} aria-labelledby="next-action-title">
        <p>Prochaine action</p>
        {nextAction ? <><h2 id="next-action-title">Relancer {primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : organization.name}</h2><div className={classes.due}>{formatDate(nextAction.due_at)}{nextAction.channel ? ` · ${nextAction.channel}` : ''}</div><ActionButton variant="primary" onClick={() => setShowComplete(true)}>Marquer comme réalisée</ActionButton></> : <><h2 id="next-action-title">Aucune prochaine action</h2><div>Cette candidature reste dans votre suivi, mais rien n’est planifié.</div>{application.statut !== 'refusee' && <ActionButton variant="primary" onClick={() => setShowSchedule(true)}>Planifier une relance</ActionButton>}</>}
      </section>

      <div className={classes.content}>
        <div className={classes.context}>
          <section><h2>Contact</h2>{primaryContact ? <address><EntityLink to={`/app/contacts/${primaryContact.id}`} from={currentDetailPath}>{primaryContact.first_name} {primaryContact.last_name}</EntityLink>{primaryContact.role && <span>{primaryContact.role}</span>}{primaryContact.email && <a href={`mailto:${primaryContact.email}`}>{primaryContact.email}</a>}{primaryContact.linkedin_url && <a href={primaryContact.linkedin_url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}</address> : <p>Aucun contact associé.</p>}</section>
          {application.description&&<section><h2>Description de l’offre</h2><p className={classes.notes}>{application.description}</p></section>}
          {application.notes&&<section><h2>Notes privées</h2><p className={classes.notes}>{application.notes}</p></section>}
          <section><h2>Entreprise</h2><p><EntityLink to={`/app/etablissements/${organization.id}`} from={currentDetailPath}>{organization.name}</EntityLink><br />{organization.relationship_summary.applications} candidature{organization.relationship_summary.applications > 1 ? 's' : ''} · {organization.relationship_summary.responses} réponse{organization.relationship_summary.responses > 1 ? 's' : ''}</p>{organization.website && <a href={organization.website} target="_blank" rel="noreferrer">Site web ↗</a>}</section>
        </div>
        <section className={classes.timeline}><div className={classes.timelineHeading}><h2>Historique</h2><ActionButton variant="quiet" onClick={()=>setShowNote(true)}>Ajouter une note</ActionButton></div>{timeline.items.length ? <ol>{timeline.items.map((event) => <li key={event.id}><time>{formatDate(event.created_at)}</time><strong>{EVENT_LABELS[event.type] ?? event.type.replaceAll('_', ' ')}</strong>{event.contenu && <p>{event.contenu}</p>}</li>)}</ol> : <p>Aucun événement enregistré.</p>}</section>
      </div>

      {showComplete && nextAction && <div className={classes.backdrop} role="presentation"><form className={classes.dialog} onSubmit={(event) => { event.preventDefault(); complete.mutate(); }}><header><div><p>Action réalisée</p><h2>Quel a été le résultat ?</h2></div><ActionButton variant="quiet" aria-label="Fermer" onClick={() => setShowComplete(false)}>×</ActionButton></header><SelectField label="Résultat" value={outcome} onChange={(event) => setOutcome(event.target.value)} options={[["no_response", "Pas encore de réponse"], ["response_received", "Réponse reçue"], ["exchange_completed", "Échange réalisé"], ["other", "Autre"]]} /><TextAreaField label="Note facultative" rows={4} value={note} onChange={(event) => setNote(event.target.value)} />{complete.isError && <p className={classes.error}>Impossible d’enregistrer. Tes informations sont conservées.</p>}<footer><ActionButton onClick={() => setShowComplete(false)}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={complete.isPending}>{complete.isPending ? 'Enregistrement…' : 'Enregistrer'}</ActionButton></footer></form></div>}
      {showSchedule && <div className={classes.backdrop} role="presentation"><form className={classes.dialog} onSubmit={(event) => { event.preventDefault(); if (dueAt) schedule.mutate(); }}><header><div><p>Prochaine action</p><h2>Planifier une relance</h2></div><ActionButton variant="quiet" aria-label="Fermer" onClick={() => setShowSchedule(false)}>×</ActionButton></header><TextField label="Date" type="date" required value={dueAt} onChange={(event) => setDueAt(event.target.value)} /><SelectField label="Canal" value={channel} onChange={(event) => setChannel(event.target.value)} options={[["email", "Email"], ["linkedin", "LinkedIn"], ["telephone", "Téléphone"], ["autre", "Autre"]]} />{schedule.isError && <p className={classes.error}>Impossible de planifier cette relance.</p>}<footer><ActionButton onClick={() => setShowSchedule(false)}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={schedule.isPending}>{schedule.isPending ? 'Planification…' : 'Planifier'}</ActionButton></footer></form></div>}
      {showNote&&<Dialog eyebrow="Historique du dossier" title="Ajouter une note" onClose={()=>setShowNote(false)}><form onSubmit={event=>{event.preventDefault();if(newNote.trim())addNote.mutate();}}><TextAreaField autoFocus label="Note" rows={6} required value={newNote} onChange={event=>setNewNote(event.target.value)}/>{addNote.isError&&<p className={classes.error}>Impossible d’ajouter la note.</p>}<footer className={classes.dialogFooter}><ActionButton onClick={()=>setShowNote(false)}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={!newNote.trim()||addNote.isPending}>{addNote.isPending?'Ajout…':'Ajouter la note'}</ActionButton></footer></form></Dialog>}
    </main>
  );
}

export default ApplicationDetails;
