import { useCallback, useState } from 'react';
import axios from 'axios';
import type { Contact } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { Dialog } from '@shared/ui/Dialog';
import { ActionButton } from '@shared/ui/Action';
import { TextAreaField, TextField } from '@shared/ui/FormField';
import {
  EntitySearchField,
  type EntitySearchOption,
} from '@shared/ui/EntitySearchField';
import classes from '@shared/ui/ContactFormModal.module.scss';
import { useI18n } from '../../i18n';
import { relationshipCopy } from '../../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../../features/relationships/auth';

export default function ContactEditModal({
  contact,
  organizationName,
  onClose,
  onSaved,
}: {
  contact: Contact;
  organizationName?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useI18n();
  const c = relationshipCopy(locale).forms;
  const redirectIfUnauthorized = useRelationshipAuthRedirect();
  const [form, setForm] = useState<Partial<Contact>>({ ...contact });
  const [organization, setOrganization] = useState<EntitySearchOption | null>(
    contact.organization_id && organizationName
      ? { id: contact.organization_id, label: organizationName }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchOrganizations = useCallback(
    async (query: string) => {
      try {
        return (await organizationService.getAll({ search: query })).map(
          (item) => ({ id: item.id, label: item.name, detail: item.type }),
        );
      } catch (caught) {
        if (redirectIfUnauthorized(caught)) return [];
        throw caught;
      }
    },
    [redirectIfUnauthorized],
  );
  const set = (key: keyof Contact, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await contactService.update(contact.id, form);
      onSaved();
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.detail || c.contactSaveError
          : c.contactSaveError,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog
      eyebrow={c.contactEditEyebrow}
      title={c.contactEditTitle}
      onClose={onClose}
    >
      <form className={classes.form} onSubmit={submit}>
        {error && <p className={classes.error}>{error}</p>}
        <div className={classes.grid}>
          <TextField
            label={c.firstName}
            required
            value={form.first_name || ''}
            onChange={(event) => set('first_name', event.target.value)}
          />
          <TextField
            label={c.lastName}
            required
            value={form.last_name || ''}
            onChange={(event) => set('last_name', event.target.value)}
          />
          <TextField
            label={c.role}
            value={form.role || ''}
            onChange={(event) => set('role', event.target.value)}
          />
          <TextField
            label={c.email}
            type="email"
            value={form.email || ''}
            onChange={(event) => set('email', event.target.value)}
          />
          <TextField
            label={c.phone}
            value={form.phone || ''}
            onChange={(event) => set('phone', event.target.value)}
          />
          <TextField
            label={c.linkedin}
            type="url"
            value={form.linkedin_url || ''}
            onChange={(event) => set('linkedin_url', event.target.value)}
          />
        </div>
        <EntitySearchField
          label={c.organization}
          value={organization}
          onSearch={searchOrganizations}
          onSelect={(option) => {
            setOrganization(option);
            set('organization_id', option.id);
          }}
          onClear={() => {
            setOrganization(null);
            set('organization_id', null);
          }}
          placeholder={c.organizationSearchMin}
        />
        <label className={classes.checkbox}>
          <input
            type="checkbox"
            checked={Boolean(form.is_recruiter)}
            onChange={(event) =>
              set('is_recruiter', event.target.checked ? 1 : 0)
            }
          />{' '}
          {c.recruiter}
        </label>
        <TextAreaField
          label={c.notes}
          rows={4}
          value={form.notes || ''}
          onChange={(event) => set('notes', event.target.value)}
        />
        <footer className={classes.footer}>
          <ActionButton onClick={onClose}>{c.cancel}</ActionButton>
          <ActionButton variant="primary" type="submit" disabled={loading}>
            {loading ? c.saving : c.save}
          </ActionButton>
        </footer>
      </form>
    </Dialog>
  );
}
