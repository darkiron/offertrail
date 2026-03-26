import React, { useEffect, useState } from 'react';
import type { Organization, OrganizationType } from '../../types';
import { organizationService } from '../../services/api';

interface OrganizationEditModalProps {
  organization?: Organization | null;
  initialName?: string;
  initialType?: OrganizationType;
  onClose: () => void;
  onSaved: (org?: Organization) => void;
}

const OrganizationEditModal: React.FC<OrganizationEditModalProps> = ({ organization, initialName, initialType = 'AUTRE', onClose, onSaved }) => {
  const isCreate = !organization;
  const [form, setForm] = useState<Partial<Organization>>({
    name: initialName || organization?.name || '',
    type: initialType || organization?.type || 'AUTRE',
    city: organization?.city || '',
    website: organization?.website || '',
    linkedin_url: organization?.linkedin_url || '',
    notes: organization?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // sync if props change
    setForm((prev) => ({
      ...prev,
      name: initialName || organization?.name || '',
      type: initialType || organization?.type || 'AUTRE',
      city: organization?.city || '',
      website: organization?.website || '',
      linkedin_url: organization?.linkedin_url || '',
      notes: organization?.notes || '',
    }));
  }, [organization, initialName, initialType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isCreate) {
        const payload: any = { name: form.name, type: form.type, city: form.city || null, website: form.website || null, linkedin_url: form.linkedin_url || null, notes: form.notes || null };
        const created = await organizationService.create(payload);
        // refetch the created org
        const full = await organizationService.getById(created.id);
        onSaved(full);
      } else if (organization) {
        await organizationService.update(organization.id, form);
        onSaved();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Échec de la sauvegarde de l’ETS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-md">
      <div className="card w-full max-w-[640px]">
        <h3 className="text-lg font-bold mb-md">{isCreate ? 'Créer un ETS' : 'Modifier l’ETS'}</h3>
        {error && <div className="alert alert-error mb-md">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <div className="col-span-2">
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Nom</label>
              <input name="name" className="input w-full" required value={form.name || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Type</label>
              <select name="type" className="input w-full" value={(form.type as any) || 'AUTRE'} onChange={handleChange}>
                <option value="CLIENT_FINAL">Client Final</option>
                <option value="ESN">ESN</option>
                <option value="CABINET_RECRUTEMENT">Cabinet</option>
                <option value="STARTUP">Startup</option>
                <option value="PME">PME</option>
                <option value="GRAND_COMPTE">Grand Compte</option>
                <option value="PORTAGE">Portage</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Ville</label>
              <input name="city" className="input w-full" value={(form.city as any) || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Site web</label>
              <input name="website" className="input w-full" value={(form.website as any) || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">LinkedIn</label>
              <input name="linkedin_url" className="input w-full" value={(form.linkedin_url as any) || ''} onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-secondary uppercase mb-xs block">Notes</label>
              <textarea name="notes" className="input w-full" rows={3} value={(form.notes as any) || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sauvegarde…' : (isCreate ? 'Créer' : 'Enregistrer')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationEditModal;
