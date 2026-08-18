import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { contactService } from '../services/api';
import type { Contact } from '../types';
import ContactEditModal from '../components/organisms/ContactEditModal';
import { DetailHeader } from '../components/organisms/DetailHeader';
import { ActionButton, ExternalAction } from '../components/atoms/Action';
import { LoadingStatus } from '../components/atoms/LoadingStatus';
import { DetailSummary } from '../components/molecules/DetailSummary';
import { RelatedRecord, RelatedRecords } from '../components/molecules/RelatedRecords';
import { Tabs } from '../components/molecules/Tabs';
import { EntityLink } from '../components/atoms/EntityLink';
import classes from './ContactDetailsPage.module.css';

type Details = Contact & { organization: {id:string;name:string;type:string}|null; applications: Array<{id:string;title:string;company:string;applied_at:string|null;status:string}>; events: Array<{ id: string | number; ts: string; type: string; event_type?: string; payload?: Record<string, unknown>; application?: { id: string; title: string; status: string } }> };
type Tab = 'overview' | 'applications' | 'activity';
const STATUS: Record<string,string> = { en_attente:'À préparer', envoyee:'Envoyée', entretien:'Entretien', offre_recue:'Offre reçue', refusee:'Refusée' };
const EVENT_LABELS: Record<string,string> = { creation:'Contact ajouté', modification:'Contact mis à jour', changement_statut:'Statut modifié', note:'Note ajoutée', relance:'Relance', contact_ajout:'Contact ajouté', note_ajout:'Note ajoutée', entretien_planifie:'Entretien planifié' };
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : 'Non renseignée';

export const ContactDetailsPage = () => {
  const { id } = useParams<{id:string}>();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab,setTab] = useState<Tab>('overview');
  const [editing,setEditing] = useState(false);
  const navigationState = location.state as { from?: string; scrollY?: number } | null;
  const from = navigationState?.from ?? '/app/contacts';
  const query = useQuery<Details>({ queryKey:['contact-details',id], queryFn:()=>contactService.getById(id!), enabled:Boolean(id) });
  const data = query.data;

  useEffect(()=>{document.title=data?`${data.first_name} ${data.last_name} — OfferTrail`:'Contact — OfferTrail';},[data]);
  if(query.isLoading)return <main className={classes.page}><div className={classes.state}><LoadingStatus>Chargement du contact…</LoadingStatus></div></main>;
  if(query.isError||!data)return <main className={classes.page}><Link className={classes.back} to={from}>← Contacts</Link><div className={classes.state}><h1>Contact introuvable</h1><p>Cette fiche n’est plus accessible.</p></div></main>;

  return <main className={classes.page}>
    {editing&&<ContactEditModal contact={data} organizationName={data.organization?.name} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);void query.refetch();}}/>}
    <DetailHeader backTo={from} backLabel="Tous les contacts" backState={{restoreScrollY:navigationState?.scrollY}} eyebrow="Relation professionnelle" title={`${data.first_name} ${data.last_name}`} subtitle={<>{data.role||'Fonction non renseignée'}{data.organization?` · ${data.organization.name}`:''}</>} badges={<>{data.is_recruiter&&<span>Recruteur</span>}{data.organization&&<span>{data.organization.type.replaceAll('_',' ')}</span>}</>} actions={<><ActionButton variant="primary" onClick={()=>setEditing(true)}>Modifier</ActionButton>{data.email&&<a className={classes.contactAction} href={`mailto:${data.email}`}>Envoyer un email</a>}{data.linkedin_url&&<ExternalAction href={data.linkedin_url}>LinkedIn ↗</ExternalAction>}</>}/>
    <DetailSummary label="Synthèse du contact" items={[{label:'Entreprise liée',value:data.organization?<EntityLink to={`/app/etablissements/${data.organization.id}`} from={`${location.pathname}${location.search}`}>{data.organization.name}</EntityLink>:'Aucune'},{label:'Candidatures liées',value:data.applications.length},{label:'Dernière mise à jour',value:date(data.updated_at)}]}/>
    <Tabs label="Contenu du contact" value={tab} onChange={setTab} items={[["overview","Coordonnées"],["applications",`Candidatures · ${data.applications.length}`],["activity",`Activité · ${data.events.length}`]]}/>
    <section className={classes.content}>
      {tab==='overview'&&<div className={classes.details}><article><span>Email</span>{data.email?<a href={`mailto:${data.email}`}>{data.email}</a>:<strong>Non renseigné</strong>}</article><article><span>Téléphone</span>{data.phone?<a href={`tel:${data.phone}`}>{data.phone}</a>:<strong>Non renseigné</strong>}</article><article className={classes.notes}><span>Notes privées</span><p>{data.notes||'Aucune note enregistrée.'}</p></article></div>}
      {tab==='applications'&&(data.applications.length?<RelatedRecords label="Candidatures liées">{data.applications.map(item=><RelatedRecord key={item.id} title={item.title} detail={`${item.company} · ${date(item.applied_at)}`} meta={STATUS[item.status]??item.status} onOpen={()=>navigate(`/app/candidatures/${item.id}`,{state:{from:`${location.pathname}${location.search}`,scrollY:window.scrollY}})}/>)}</RelatedRecords>:<Empty text="Aucune candidature liée à ce contact."/>)}
      {tab==='activity'&&(data.events.length?<ol className={classes.timeline}>{data.events.map(event=>{const kind=String(event.type||event.event_type);return <li key={`${event.id}-${event.ts}`}><time>{date(event.ts)}</time><div><strong>{EVENT_LABELS[kind]??kind.replaceAll('_',' ')}</strong>{event.application&&<EntityLink to={`/app/candidatures/${event.application.id}`} from={`${location.pathname}${location.search}`}>{event.application.title}</EntityLink>}</div></li>})}</ol>:<Empty text="Aucune activité enregistrée."/>)}
    </section>
  </main>;
};
function Empty({text}:{text:string}){return <div className={classes.empty}>{text}</div>}
export default ContactDetailsPage;
