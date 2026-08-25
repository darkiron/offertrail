import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import type { Contact, Organization } from '../../types';
import { contactService } from '../../services/api/contacts';
import { organizationService } from '../../services/api/organizations';
import { Dialog } from '@shared/ui/Dialog';
import { ActionButton } from '@shared/ui/Action';
import { TextAreaField, TextField } from '@shared/ui/FormField';
import classes from '@shared/ui/ContactFormModal.module.scss';
import { useI18n } from '../../i18n';
import { relationshipCopy } from '../../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../../features/relationships/auth';

export default function ContactCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (contact?: Contact) => void;
}) {
  const { locale } = useI18n();
  const c = relationshipCopy(locale).forms;
  const redirectIfUnauthorized = useRelationshipAuthRedirect();
  const [form, setForm] = useState<Partial<Contact>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    is_recruiter: 0,
    linkedin_url: '',
    notes: '',
    organization_id: null,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    organizationService
      .getAll()
      .then(setOrganizations)
      .catch((caught) => {
        redirectIfUnauthorized(caught);
      });
  }, [redirectIfUnauthorized]);
  const suggestions = useMemo(() => {
    const q = organizationName.trim().toLocaleLowerCase(locale);
    return q
      ? organizations
          .filter((item) => item.name.toLocaleLowerCase(locale).includes(q))
          .slice(0, 6)
      : [];
  }, [locale, organizationName, organizations]);
  const set = (key: keyof Contact, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await contactService.create(form);
      onCreated(await contactService.getById(created.id));
      onClose();
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.detail || c.contactCreateError
          : c.contactCreateError,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog
      eyebrow={c.contactCreateEyebrow}
      title={c.contactCreateTitle}
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
        <div className={classes.organization}>
          <TextField
            label={c.organization}
            value={organizationName}
            placeholder={c.organizationSearch}
            autoComplete="off"
            onChange={(event) => {
              const value = event.target.value;
              setOrganizationName(value);
              const match = organizations.find(
                (item) =>
                  item.name.localeCompare(value, locale, {
                    sensitivity: 'base',
                  }) === 0,
              );
              set('organization_id', match?.id ?? null);
            }}
          />
          {organizationName && suggestions.length > 0 && (
            <div className={classes.suggestions}>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOrganizationName(item.name);
                    set('organization_id', item.id);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
            {loading ? c.creating : c.create}
          </ActionButton>
        </footer>
      </form>
    </Dialog>
  );
}
