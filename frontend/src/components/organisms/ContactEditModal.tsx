import { useCallback, useState } from 'react';
import axios from 'axios';
import type { Contact } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { Dialog } from '../molecules/Dialog';
import { ActionButton } from '../atoms/Action';
import { TextAreaField, TextField } from '../atoms/FormField';
import { EntitySearchField, type EntitySearchOption } from '../molecules/EntitySearchField';
import classes from './ContactFormModal.module.css';

export default function ContactEditModal({contact,organizationName,onClose,onSaved}:{contact:Contact;organizationName?:string|null;onClose:()=>void;onSaved:()=>void}){
  const [form,setForm]=useState<Partial<Contact>>({...contact});
  const [organization,setOrganization]=useState<EntitySearchOption|null>(contact.organization_id&&organizationName?{id:contact.organization_id,label:organizationName}:null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const searchOrganizations=useCallback(async(query:string)=>(await organizationService.getAll({search:query})).map(item=>({id:item.id,label:item.name,detail:item.type})),[]);
  const set=(key:keyof Contact,value:unknown)=>setForm(current=>({...current,[key]:value}));
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setLoading(true);setError(null);try{await contactService.update(contact.id,form);onSaved();}catch(caught){setError(axios.isAxiosError(caught)?caught.response?.data?.detail||'Impossible d’enregistrer le contact.':'Impossible d’enregistrer le contact.');}finally{setLoading(false)}};
  return <Dialog eyebrow="Fiche contact" title="Modifier l’interlocuteur" onClose={onClose}><form className={classes.form} onSubmit={submit}>{error&&<p className={classes.error}>{error}</p>}<div className={classes.grid}><TextField label="Prénom" required value={form.first_name||''} onChange={event=>set('first_name',event.target.value)}/><TextField label="Nom" required value={form.last_name||''} onChange={event=>set('last_name',event.target.value)}/><TextField label="Rôle / poste" value={form.role||''} onChange={event=>set('role',event.target.value)}/><TextField label="Email" type="email" value={form.email||''} onChange={event=>set('email',event.target.value)}/><TextField label="Téléphone" value={form.phone||''} onChange={event=>set('phone',event.target.value)}/><TextField label="LinkedIn" type="url" value={form.linkedin_url||''} onChange={event=>set('linkedin_url',event.target.value)}/></div><EntitySearchField label="Entreprise" value={organization} onSearch={searchOrganizations} onSelect={option=>{setOrganization(option);set('organization_id',option.id)}} onClear={()=>{setOrganization(null);set('organization_id',null)}} placeholder="Saisir au moins 2 caractères…"/><label className={classes.checkbox}><input type="checkbox" checked={Boolean(form.is_recruiter)} onChange={event=>set('is_recruiter',event.target.checked?1:0)}/> Ce contact intervient comme recruteur</label><TextAreaField label="Notes privées" rows={4} value={form.notes||''} onChange={event=>set('notes',event.target.value)}/><footer className={classes.footer}><ActionButton onClick={onClose}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={loading}>{loading?'Enregistrement…':'Enregistrer'}</ActionButton></footer></form></Dialog>;
}
