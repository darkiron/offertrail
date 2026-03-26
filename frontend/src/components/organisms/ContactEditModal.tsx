import React, { useEffect, useMemo, useState } from 'react';
import type { Contact, Organization } from '../../types';
import { contactService, organizationService } from '../../services/api';
import OrganizationTypeBadge from '../atoms/OrganizationTypeBadge';
import OrganizationEditModal from './OrganizationEditModal';

interface ContactEditModalProps {
  contact: Contact;
  onClose: () => void;
  onSaved: () => void;
}

const ContactEditModal: React.FC<ContactEditModalProps> = ({ contact, onClose, onSaved }) => {
  const [form, setForm] = useState<Partial<Contact>>({ ...contact });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return organizations.filter(o => o.name.toLowerCase().includes(q)).slice(0, 6);
  }, [organizations, query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await contactService.update(contact.id, form);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Échec de la sauvegarde du contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-md">
      <div className="card w-full max-w-[720px]">
        <h3 className="text-lg font-bold mb-md">Modifier le contact</h3>
        {error && <div className="alert alert-error mb-md">{error}</div>}
        <form onSubmit={handleSave} className="flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Prénom</label>
              <input name="first_name" className="input w-full" value={form.first_name || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Nom</label>
              <input name="last_name" className="input w-full" value={form.last_name || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Rôle / Poste</label>
              <input name="role" className="input w-full" value={form.role || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Email</label>
              <input name="email" className="input w-full" value={form.email || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Téléphone</label>
              <input name="phone" className="input w-full" value={form.phone || ''} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-sm">
              <input id="is_recruiter" name="is_recruiter" type="checkbox" className="mr-xs" checked={!!form.is_recruiter} onChange={handleChange} />
              <label htmlFor="is_recruiter" className="text-xs font-bold text-secondary uppercase">Recruteur</label>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">LinkedIn</label>
              <input name="linkedin_url" className="input w-full" value={form.linkedin_url || ''} onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Notes</label>
              <textarea name="notes" className="input w-full" rows={3} value={form.notes || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md items-start">
            <div className="relative">
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Établissement</label>
              <input 
                className="input w-full" 
                placeholder="Rechercher un ETS…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-xl">
                  {filtered.length > 0 ? (
                    filtered.map(org => (
                      <div key={org.id} className="p-sm hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                           onClick={() => { setForm(prev => ({ ...prev, organization_id: org.id })); setQuery(org.name); }}>
                        <span className="font-semibold">{org.name}</span>
                        <OrganizationTypeBadge type={org.type} size="xs" />
                      </div>
                    ))
                  ) : (
                    <div className="p-sm text-sm text-secondary">Aucun résultat
                      <button type="button" className="ml-sm text-blue-400 hover:underline" onClick={() => setShowCreateOrg(true)}>+ Créer l’ETS</button>
                    </div>
                  )}
                </div>
              )}
              {form.organization_id && (
                (() => {
                  const org = organizations.find(o => o.id === form.organization_id);
                  return org ? (
                    <div className="mt-xs flex items-center gap-xs">
                      <OrganizationTypeBadge type={org.type} size="xs" />
                      <span className="text-xs">{org.name}</span>
                      <button type="button" className="text-xs text-red-400 ml-sm" onClick={() => { setForm(prev => ({ ...prev, organization_id: null })); setQuery(''); }}>Retirer</button>
                    </div>
                  ) : null;
                })()
              )}
            </div>
          </div>

          <div className="flex justify-between mt-md">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sauvegarde…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>

      {showCreateOrg && (
        <OrganizationEditModal 
          initialName={query}
          onClose={() => setShowCreateOrg(false)}
          onSaved={(org) => { 
            setShowCreateOrg(false);
            if (org) {
              setOrganizations(prev => [org, ...prev]);
              setForm(prev => ({ ...prev, organization_id: org.id }));
              setQuery(org.name);
            }
          }}
        />
      )}
    </div>
  );
};

export default ContactEditModal;
