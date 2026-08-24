import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { dashboardService } from '../services/api/dashboard';
import type { TodayAction } from '../types';
import classes from './Dashboard.module.css';
import { ActionButton } from '../components/atoms/Action';
import { SelectField } from '../components/atoms/FormField';

const dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function ActionDialog({ action, onClose }: { action: TodayAction; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState('no_response');
  const [note, setNote] = useState('');
  const [next, setNext] = useState('3');
  const mutation = useMutation({
    mutationFn: () => dashboardService.completeAction(action.id, {
      outcome,
      note: note.trim() || undefined,
      next_action: next === 'none' ? null : { due_at: new Date(Date.now() + Number(next) * 86400000).toISOString() },
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['today'] });
      onClose();
    },
  });
  return <div className={classes.backdrop} role="presentation" onMouseDown={onClose}>
    <section className={classes.dialog} role="dialog" aria-modal="true" aria-labelledby="result-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className={classes.eyebrow}>Relance</span><h2 id="result-title">Enregistrer le résultat</h2></div><button onClick={onClose} aria-label="Fermer">×</button></header>
      <fieldset><legend>Quel a été le résultat ?</legend>{[['no_response','Pas encore de réponse'],['response_received','Réponse reçue'],['conversation_held','Échange réalisé'],['other','Autre résultat']].map(([value,label]) => <label key={value} className={outcome === value ? classes.selected : ''}><input type="radio" name="outcome" value={value} checked={outcome === value} onChange={() => setOutcome(value)} />{label}</label>)}</fieldset>
      <label className={classes.field}>Note facultative<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Message envoyé sur LinkedIn" /></label>
      <SelectField className={classes.field} label="Prochaine étape" value={next} onChange={(e) => setNext(e.target.value)} options={[["3", "Relancer dans 3 jours"], ["7", "Relancer dans une semaine"], ["none", "Aucune pour le moment"]]} />
      {mutation.isError ? <p className={classes.error}>Impossible d'enregistrer. Vos informations sont conservées.</p> : null}
      <footer><ActionButton onClick={onClose}>Annuler</ActionButton><ActionButton variant="primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}</ActionButton></footer>
    </section>
  </div>;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { openCreateApplication } = useOutletContext<{ openCreateApplication: () => void }>();
  const [selected, setSelected] = useState<TodayAction | null>(null);
  const query = useQuery({ queryKey: ['today'], queryFn: dashboardService.getToday });
  useEffect(() => { document.title = "Aujourd'hui — OfferTrail"; }, []);
  if (query.isLoading) return <main className={classes.page}><div className={classes.skeleton} /><div className={classes.skeletonCard} /></main>;
  if (query.isError || !query.data) return <main className={classes.page}><h1>Impossible de charger votre journée.</h1><ActionButton variant="primary" onClick={() => query.refetch()}>Réessayer</ActionButton></main>;
  const data = query.data;
  if (data.activation.state === 'onboarding') return <main className={classes.page}><p className={classes.eyebrow}>Bienvenue</p><h1>Construisons un suivi utile.</h1><p className={classes.lede}>Ajoutez une candidature puis planifiez sa prochaine étape.</p><div className={classes.onboarding}><ActionButton variant="primary" onClick={openCreateApplication}>Ajouter une candidature</ActionButton><ActionButton onClick={() => navigate('/app/import')}>Importer un fichier</ActionButton></div></main>;
  const [priority, ...following] = data.actions.items;
  return <main className={classes.page}>
    <header className={classes.pageHead}><div><p className={classes.eyebrow}>{dateLabel.format(new Date())}</p><h1>{data.actions.due_count ? `${data.actions.due_count} action${data.actions.due_count > 1 ? 's' : ''} mérite${data.actions.due_count > 1 ? 'nt' : ''} votre attention.` : 'Tout est à jour.'}</h1><p className={classes.lede}>{data.actions.due_count ? 'Commencez par la plus urgente, le reste peut attendre.' : 'Votre prochaine échéance reste visible dans vos candidatures.'}</p></div><ActionButton variant="primary" onClick={openCreateApplication}>＋ Une candidature</ActionButton></header>
    <div className={classes.grid}><section><div className={classes.sectionTitle}><h2>À faire maintenant</h2><span>{data.actions.due_count ? `1 sur ${data.actions.due_count}` : 'Aucune action due'}</span></div>
      {priority ? <><article className={classes.priority}><div className={classes.priorityMeta}><span>{priority.urgency === 'overdue' ? 'Relance en retard' : 'Relance prévue'}</span><span>{priority.application.status}</span></div><h2>{priority.application.title}</h2><p className={classes.company}>{priority.organization.name}</p><p>Retrouvez le contexte avant d'agir, puis enregistrez le résultat.</p><div className={classes.actions}><button onClick={() => navigate(`/app/candidatures/${priority.application.id}`)}>Ouvrir le dossier →</button><button onClick={() => setSelected(priority)}>Marquer comme réalisée</button></div></article>{following.map((action) => <button className={classes.queue} key={action.id} onClick={() => navigate(`/app/candidatures/${action.application.id}`)}><span><strong>{action.application.title}</strong><small>{action.organization.name}</small></span><time>{new Date(action.due_at).toLocaleDateString('fr-FR')}</time></button>)}</> : <div className={classes.empty}>Aucune relance en attente. Vous pouvez préparer la prochaine candidature.</div>}
    </section><aside><h2>Votre recherche</h2><dl><div><dt>{data.summary.active_applications}</dt><dd>candidatures actives</dd></div><div><dt>{data.summary.responses_30d}</dt><dd>réponses sur 30 jours</dd></div><div><dt>{data.summary.interviews_30d}</dt><dd>entretiens sur 30 jours</dd></div></dl></aside></div>
    {selected ? <ActionDialog action={selected} onClose={() => setSelected(null)} /> : null}
  </main>;
}

export default Dashboard;
