import { useState } from 'react';
import axios from 'axios';
import { organizationService, type OrganizationPortfolioItem } from '../../services/api';
import { ActionButton } from '../atoms/Action';
import { SelectField, TextAreaField, TextField } from '../atoms/FormField';
import { Dialog } from '../molecules/Dialog';
import classes from './ContactFormModal.module.css';

const TYPES = [['CLIENT_FINAL','Client final'],['ESN','ESN'],['CABINET_RECRUTEMENT','Cabinet de recrutement'],['STARTUP','Startup'],['PME','PME'],['GRAND_COMPTE','Grand compte'],['PORTAGE','Portage'],['AUTRE','Autre']] as const;

export function WorkflowOrganizationEditModal({organization,onClose,onSaved}:{organization:OrganizationPortfolioItem;onClose:()=>void;onSaved:()=>void}){
  const [form,setForm]=useState({name:organization.name,type:organization.type.toUpperCase(),website:organization.website??'',description:organization.description??''});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setLoading(true);setError('');try{await organizationService.updateWorkflow(organization.id,{nom:form.name.trim(),type:form.type,site_web:form.website.trim()||null,description:form.description.trim()||null});onSaved()}catch(caught){setError(axios.isAxiosError(caught)?caught.response?.data?.detail||'Impossible d’enregistrer l’entreprise.':'Impossible d’enregistrer l’entreprise.')}finally{setLoading(false)}};
  return <Dialog eyebrow="Fiche entreprise" title="Modifier l’entreprise" onClose={onClose}><form className={classes.form} onSubmit={submit}>{error&&<p className={classes.error}>{error}</p>}<div className={classes.grid}><TextField label="Nom" required value={form.name} onChange={event=>setForm(current=>({...current,name:event.target.value}))}/><SelectField label="Type" value={form.type} options={TYPES} onChange={event=>setForm(current=>({...current,type:event.target.value}))}/><TextField label="Site web" type="url" value={form.website} placeholder="https://…" onChange={event=>setForm(current=>({...current,website:event.target.value}))}/></div><TextAreaField label="Contexte" rows={4} value={form.description} onChange={event=>setForm(current=>({...current,description:event.target.value}))}/><footer className={classes.footer}><ActionButton onClick={onClose}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={loading||!form.name.trim()}>{loading?'Enregistrement…':'Enregistrer'}</ActionButton></footer></form></Dialog>;
}
