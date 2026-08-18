import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import type { Contact, Organization } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { Dialog } from '../molecules/Dialog';
import { ActionButton } from '../atoms/Action';
import { TextAreaField, TextField } from '../atoms/FormField';
import classes from './ContactFormModal.module.css';

export default function ContactCreateModal({ onClose, onCreated }: { onClose:()=>void; onCreated:(contact?:Contact)=>void }) {
  const [form,setForm]=useState<Partial<Contact>>({first_name:'',last_name:'',email:'',phone:'',role:'',is_recruiter:0,linkedin_url:'',notes:'',organization_id:null});
  const [organizations,setOrganizations]=useState<Organization[]>([]);
  const [organizationName,setOrganizationName]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{organizationService.getAll().then(setOrganizations).catch(()=>{});},[]);
  const suggestions=useMemo(()=>{const q=organizationName.trim().toLocaleLowerCase('fr');return q?organizations.filter(item=>item.name.toLocaleLowerCase('fr').includes(q)).slice(0,6):[]},[organizationName,organizations]);
  const set=(key:keyof Contact,value:unknown)=>setForm(current=>({...current,[key]:value}));
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setLoading(true);setError(null);try{const created=await contactService.create(form);onCreated(await contactService.getById(created.id));onClose();}catch(caught){setError(axios.isAxiosError(caught)?caught.response?.data?.detail||'Impossible de créer le contact.':'Impossible de créer le contact.');}finally{setLoading(false)}};
  return <Dialog eyebrow="Nouveau contact" title="Ajouter un interlocuteur" onClose={onClose}><form className={classes.form} onSubmit={submit}>{error&&<p className={classes.error}>{error}</p>}<div className={classes.grid}><TextField label="Prénom" required value={form.first_name||''} onChange={event=>set('first_name',event.target.value)}/><TextField label="Nom" required value={form.last_name||''} onChange={event=>set('last_name',event.target.value)}/><TextField label="Rôle / poste" value={form.role||''} onChange={event=>set('role',event.target.value)}/><TextField label="Email" type="email" value={form.email||''} onChange={event=>set('email',event.target.value)}/><TextField label="Téléphone" value={form.phone||''} onChange={event=>set('phone',event.target.value)}/><TextField label="LinkedIn" type="url" value={form.linkedin_url||''} onChange={event=>set('linkedin_url',event.target.value)}/></div><div className={classes.organization}><TextField label="Entreprise" value={organizationName} placeholder="Rechercher une entreprise…" autoComplete="off" onChange={event=>{const value=event.target.value;setOrganizationName(value);const match=organizations.find(item=>item.name.localeCompare(value,'fr',{sensitivity:'base'})===0);set('organization_id',match?.id??null)}}/>{organizationName&&suggestions.length>0&&<div className={classes.suggestions}>{suggestions.map(item=><button key={item.id} type="button" onClick={()=>{setOrganizationName(item.name);set('organization_id',item.id)}}>{item.name}</button>)}</div>}</div><label className={classes.checkbox}><input type="checkbox" checked={Boolean(form.is_recruiter)} onChange={event=>set('is_recruiter',event.target.checked?1:0)}/> Ce contact intervient comme recruteur</label><TextAreaField label="Notes privées" rows={4} value={form.notes||''} onChange={event=>set('notes',event.target.value)}/><footer className={classes.footer}><ActionButton onClick={onClose}>Annuler</ActionButton><ActionButton variant="primary" type="submit" disabled={loading}>{loading?'Création…':'Créer le contact'}</ActionButton></footer></form></Dialog>;
}
