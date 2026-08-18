import { useCallback, useState } from 'react';
import { applicationService, organizationService, type ApplicationWorkspace } from '../../services/api';
import { ActionButton } from '../atoms/Action';
import { SelectField, TextAreaField, TextField } from '../atoms/FormField';
import { Dialog } from '../molecules/Dialog';
import { EntitySearchField, type EntitySearchOption } from '../molecules/EntitySearchField';
import classes from './ContactFormModal.module.css';

const STATUSES = [["en_attente","À préparer"],["envoyee","Envoyée"],["entretien","Entretien"],["offre_recue","Offre reçue"],["refusee","Refusée"]] as const;
const CONTRACTS = [["","Non renseigné"],["cdi","CDI"],["cdd","CDD"],["freelance","Freelance"],["stage","Stage"],["alternance","Alternance"],["autre","Autre"]] as const;

export function WorkflowApplicationEditModal({ workspace, onClose, onSaved }: { workspace:ApplicationWorkspace; onClose:()=>void; onSaved:()=>void }) {
  const app=workspace.application;
  const [recruiter,setRecruiter]=useState<EntitySearchOption|null>({id:app.etablissement_id,label:workspace.organization.name,detail:workspace.organization.type});
  const [finalCustomer,setFinalCustomer]=useState<EntitySearchOption|null>(workspace.final_customer?{id:workspace.final_customer.id,label:workspace.final_customer.name}:null);
  const [form,setForm]=useState({poste:app.poste,statut:app.statut,type_contrat:app.type_contrat??'',source:app.source??'',url_offre:app.url_offre??'',date_candidature:app.date_candidature?.slice(0,10)??'',salaire_vise:app.salaire_vise?String(app.salaire_vise):'',tjm_vise:app.tjm_vise?String(app.tjm_vise):'',description:app.description??'',notes:app.notes??''});
  const [expanded,setExpanded]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const searchOrganizations=useCallback(async(query:string)=>(await organizationService.searchWorkflow(query)).map(item=>({id:item.id,label:item.nom,detail:item.type})),[]);
  const createFinalCustomer=useCallback(async(name:string)=>{const item=await organizationService.createWorkflow({nom:name,type:'CLIENT_FINAL'});return{id:item.id,label:item.nom,detail:'Client final'}},[]);
  const set=(key:keyof typeof form,value:string)=>setForm(current=>({...current,[key]:value}));
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(!recruiter)return;setLoading(true);setError('');try{await applicationService.updateWorkflowDetails(app.id,{poste:form.poste,statut:form.statut,type_contrat:form.type_contrat||null,etablissement_id:String(recruiter.id),client_final_id:finalCustomer?String(finalCustomer.id):null,source:form.source||null,url_offre:form.url_offre||null,date_candidature:form.date_candidature?new Date(`${form.date_candidature}T12:00:00`).toISOString():null,salaire_vise:form.type_contrat==='freelance'?null:(form.salaire_vise?Number(form.salaire_vise):null),tjm_vise:form.type_contrat==='freelance'?(form.tjm_vise?Number(form.tjm_vise):null):null,description:form.description||null,notes:form.notes||null});onSaved();}catch{setError('Impossible d’enregistrer le dossier.');}finally{setLoading(false)}};
  return <Dialog eyebrow="Dossier de candidature" title="Modifier le dossier" onClose={onClose}><form className={classes.form} onSubmit={submit}>
    {error&&<p className={classes.error}>{error}</p>}
    <div className={classes.grid}><TextField label="Poste" required value={form.poste} onChange={event=>set('poste',event.target.value)}/><SelectField label="Statut" value={form.statut} onChange={event=>set('statut',event.target.value)} options={STATUSES}/><SelectField label="Type de contrat" value={form.type_contrat} onChange={event=>set('type_contrat',event.target.value)} options={CONTRACTS}/></div>
    <div className={classes.grid}><EntitySearchField label="Entreprise recruteuse" value={recruiter} onSearch={searchOrganizations} onSelect={setRecruiter} onClear={()=>setRecruiter(null)} placeholder="Rechercher une entreprise…"/><EntitySearchField label="Client final" hint="Recherchez une entreprise existante ou créez-la sans quitter le dossier." value={finalCustomer} onSearch={searchOrganizations} onSelect={option=>{if(String(option.id)!==String(recruiter?.id))setFinalCustomer(option)}} onClear={()=>setFinalCustomer(null)} onCreate={createFinalCustomer} createLabel={name=>`Créer « ${name} » comme client final`} placeholder="Rechercher ou créer le client final…"/></div>
    <button className={classes.disclosure} type="button" onClick={()=>setExpanded(value=>!value)}>{expanded?'Masquer les détails':'Afficher les détails complémentaires'} <span>{expanded?'−':'+'}</span></button>
    {expanded&&<><div className={classes.grid}><TextField label="Source" value={form.source} onChange={event=>set('source',event.target.value)}/><TextField label="Date de candidature" type="date" value={form.date_candidature} onChange={event=>set('date_candidature',event.target.value)}/>{form.type_contrat==='freelance'?<TextField label="TJM visé (€ / jour)" type="number" min="0" value={form.tjm_vise} onChange={event=>set('tjm_vise',event.target.value)}/>:<TextField label="Salaire brut annuel visé (€)" type="number" min="0" value={form.salaire_vise} onChange={event=>set('salaire_vise',event.target.value)}/>}<TextField label="Lien vers l’offre" type="url" value={form.url_offre} onChange={event=>set('url_offre',event.target.value)}/></div><TextAreaField label="Description de l’offre" rows={3} value={form.description} onChange={event=>set('description',event.target.value)}/><TextAreaField label="Notes privées" rows={3} value={form.notes} onChange={event=>set('notes',event.target.value)}/></>}
    <footer className={classes.footer}><ActionButton onClick={onClose}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={loading||!recruiter}>{loading?'Enregistrement…':'Enregistrer'}</ActionButton></footer>
  </form></Dialog>;
}
