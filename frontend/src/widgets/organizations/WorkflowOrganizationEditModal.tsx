import { useState } from 'react';
import axios from 'axios';
import {
  organizationService,
  type OrganizationPortfolioItem,
} from '../../services/api/organizations';
import { ActionButton } from '@shared/ui/Action';
import { SelectField, TextAreaField, TextField } from '@shared/ui/FormField';
import { Dialog } from '@shared/ui/Dialog';
import classes from '@shared/ui/ContactFormModal.module.scss';
import { useI18n } from '../../i18n';
import {
  normalizeRelationshipKey,
  relationshipCopy,
} from '../../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../../features/relationships/auth';

const TYPE_VALUES = [
  'CLIENT_FINAL',
  'ESN',
  'CABINET_RECRUTEMENT',
  'STARTUP',
  'PME',
  'GRAND_COMPTE',
  'PORTAGE',
  'AUTRE',
] as const;

export function WorkflowOrganizationEditModal({
  organization,
  onClose,
  onSaved,
}: {
  organization: OrganizationPortfolioItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = useI18n();
  const copy = relationshipCopy(locale);
  const c = copy.forms;
  const redirectIfUnauthorized = useRelationshipAuthRedirect();
  const types = TYPE_VALUES.map((value) => [
    value,
    copy.types[normalizeRelationshipKey(value) as keyof typeof copy.types],
  ]) as ReadonlyArray<readonly [string, string]>;
  const [form, setForm] = useState({
    name: organization.name,
    type: organization.type.toUpperCase(),
    website: organization.website ?? '',
    description: organization.description ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await organizationService.updateWorkflow(organization.id, {
        nom: form.name.trim(),
        type: form.type,
        site_web: form.website.trim() || null,
        description: form.description.trim() || null,
      });
      onSaved();
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(
        axios.isAxiosError(caught)
          ? caught.response?.data?.detail || c.organizationSaveError
          : c.organizationSaveError,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog
      eyebrow={c.organizationEditEyebrow}
      title={c.organizationEditTitle}
      onClose={onClose}
    >
      <form className={classes.form} onSubmit={submit}>
        {error && <p className={classes.error}>{error}</p>}
        <div className={classes.grid}>
          <TextField
            label={c.name}
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <SelectField
            label={c.type}
            value={form.type}
            options={types}
            onChange={(event) =>
              setForm((current) => ({ ...current, type: event.target.value }))
            }
          />
          <TextField
            label={c.website}
            type="url"
            value={form.website}
            placeholder={c.urlPlaceholder}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                website: event.target.value,
              }))
            }
          />
        </div>
        <TextAreaField
          label={c.context}
          rows={4}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
        <footer className={classes.footer}>
          <ActionButton onClick={onClose}>{c.cancel}</ActionButton>
          <ActionButton
            variant="primary"
            type="submit"
            disabled={loading || !form.name.trim()}
          >
            {loading ? c.saving : c.save}
          </ActionButton>
        </footer>
      </form>
    </Dialog>
  );
}
