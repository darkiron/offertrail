import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { organizationService } from '../services/api/organizations';
import classes from './CompanyDetailsPage.module.css';
import { ActionButton, ActionLink, ExternalAction } from '../components/atoms/Action';
import { LoadingStatus } from '../components/atoms/LoadingStatus';
import { DetailSummary } from '../components/molecules/DetailSummary';
import { RelatedRecord, RelatedRecords } from '../components/molecules/RelatedRecords';
import { Tabs } from '../components/molecules/Tabs';
import { DetailHeader } from '../components/organisms/DetailHeader';
import { WorkflowOrganizationEditModal } from '../components/organisms/WorkflowOrganizationEditModal';
import { EntityLink } from '../components/atoms/EntityLink';

type Tab = 'applications' | 'contacts' | 'activity';
const TYPE_LABELS: Record<string, string> = { esn: 'ESN', cabinet_recrutement: 'Cabinet', startup: 'Startup', pme: 'PME', grand_compte: 'Grand compte', portage: 'Portage', autre: 'Autre', independant: 'Indépendant', client_final: 'Client final' };
const STATUS_LABELS: Record<string, string> = { brouillon: 'Brouillon', en_attente: 'À préparer', envoyee: 'Envoyée', entretien: 'Entretien', offre_recue: 'Offre reçue', refusee: 'Refusée', abandonnee: 'Abandonnée' };
const EVENT_LABELS: Record<string, string> = { creation: 'Candidature créée', statut_change: 'Statut modifié', relance_planifiee: 'Relance planifiée', relance_envoyee: 'Relance envoyée', note_ajout: 'Note ajoutée', entretien_planifie: 'Entretien planifié', offre_recue: 'Offre reçue' };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Non renseignée';

export const CompanyDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('applications');
  const [editing, setEditing] = useState(false);
  const navigationState = location.state as { from?: string; scrollY?: number } | null;
  const from = navigationState?.from ?? '/app/etablissements';
  const query = useQuery({ queryKey:['organization-workspace',id], queryFn:()=>organizationService.getWorkspace(id!), enabled:Boolean(id) });
  const data = query.data;

  useEffect(() => { if(data) document.title = `${data.organization.name} — OfferTrail`; }, [data]);
  if (query.isLoading) return <main className={classes.page}><div className={classes.state}><LoadingStatus>Chargement de la fiche entreprise…</LoadingStatus></div></main>;
  if (query.isError || !data) return <main className={classes.page}><Link className={classes.back} to={from}>← Entreprises</Link><div className={classes.state}><h1>Fiche introuvable</h1><p>Cette entreprise n’est pas reliée à votre suivi ou n’existe plus.</p></div></main>;

  const { organization } = data;
  return <main className={classes.page}>
    <DetailHeader backTo={from} backLabel="Toutes les entreprises" backState={{restoreScrollY:navigationState?.scrollY}} eyebrow="Relation entreprise" title={organization.name} subtitle={`Suivie depuis ${date(organization.created_at)}`} badges={<span>{TYPE_LABELS[organization.type] ?? organization.type}</span>} actions={<>{organization.website&&<ExternalAction href={organization.website}>Visiter le site ↗</ExternalAction>}<ActionButton variant="primary" onClick={()=>setEditing(true)}>Modifier</ActionButton><ActionLink to={`/app/etablissements/maintenance?source=${organization.id}`}>Doublons et fusion</ActionLink></>}/>
    <DetailSummary label="Synthèse de la relation" items={[
      {label:'Candidatures',value:organization.applications_count,detail:'historique relié'},
      {label:'Réponses',value:organization.responses_count,detail:`${organization.response_rate}% des candidatures`},
      {label:'Issues positives',value:organization.positive_count,detail:'entretiens ou offres'},
      {label:'Dernière activité',value:date(organization.updated_at),detail:'dans votre suivi'},
    ]}/>
    {organization.description&&<section className={classes.context}><span>Contexte</span><p>{organization.description}</p></section>}
    <Tabs label="Contenu de la fiche" value={tab} onChange={setTab} items={[["applications",`Candidatures · ${data.applications.length}`],["contacts",`Contacts · ${data.contacts.length}`],["activity",`Activité · ${data.activity.length}`]]}/>
    <section className={classes.content}>
      {tab==='applications'&&(data.applications.length?<RelatedRecords label="Candidatures liées">{data.applications.map(application=><RelatedRecord key={application.id} title={application.title} detail={`${application.source||'Source non renseignée'} · candidature du ${date(application.applied_at)}`} meta={STATUS_LABELS[application.status]??application.status} onOpen={()=>navigate(`/app/candidatures/${application.id}`,{state:{from:`${location.pathname}${location.search}`,scrollY:window.scrollY}})}/>)}</RelatedRecords>:<Empty title="Aucune candidature" text="Cette entreprise n’a encore aucune candidature dans votre suivi."/>)}
      {tab==='contacts'&&(data.contacts.length?<RelatedRecords label="Contacts liés">{data.contacts.map(contact=><RelatedRecord key={contact.id} title={`${contact.first_name} ${contact.last_name}`} detail={contact.email||'Email non renseigné'} meta={contact.role||'Fonction non renseignée'} onOpen={()=>navigate(`/app/contacts/${contact.id}`,{state:{from:`${location.pathname}${location.search}`,scrollY:window.scrollY}})}/>)}</RelatedRecords>:<Empty title="Aucun contact" text="Ajoutez les interlocuteurs rencontrés depuis une candidature."/>)}
      {tab==='activity'&&(data.activity.length?<ol className={classes.timeline}>{data.activity.map(item=><li key={item.id}><time>{date(item.created_at)}</time><div><strong>{EVENT_LABELS[item.type]??item.type.replaceAll('_',' ')}</strong>{item.content&&<p>{item.content}</p>}<EntityLink to={`/app/candidatures/${item.application_id}`} from={`${location.pathname}${location.search}`}>Ouvrir la candidature</EntityLink></div></li>)}</ol>:<Empty title="Aucune activité" text="Les changements de statut et relances apparaîtront ici."/>)}
    </section>
    {editing&&<WorkflowOrganizationEditModal organization={organization} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);void query.refetch()}}/>}
  </main>;
};
function Empty({ title, text }: { title: string; text: string }) { return <div className={classes.empty}><h2>{title}</h2><p>{text}</p></div>; }
export default CompanyDetailsPage;
