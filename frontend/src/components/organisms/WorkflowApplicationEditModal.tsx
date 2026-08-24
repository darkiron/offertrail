import { useCallback, useState } from 'react';
import {
  applicationService,
  organizationService,
  type ApplicationWorkspace,
} from '../../services/api';
import { ActionButton } from '../atoms/Action';
import { SelectField, TextAreaField, TextField } from '../atoms/FormField';
import { Dialog } from '../molecules/Dialog';
import {
  EntitySearchField,
  type EntitySearchOption,
} from '../molecules/EntitySearchField';
import classes from './ContactFormModal.module.scss';
import { useI18n } from '../../i18n';

export function WorkflowApplicationEditModal({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: ApplicationWorkspace;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const statuses = [
    ['en_attente', t('statut.en_attente')],
    ['envoyee', t('statut.envoyee')],
    ['entretien', t('statut.entretien')],
    ['offre_recue', t('statut.offre_recue')],
    ['refusee', t('statut.refusee')],
  ] as const;
  const contracts = [
    ['', t('applicationWorkspace.notProvided')],
    ['cdi', t('applicationWorkspace.cdi')],
    ['cdd', t('applicationWorkspace.cdd')],
    ['freelance', t('applicationWorkspace.freelance')],
    ['stage', t('applicationWorkspace.internship')],
    ['alternance', t('applicationWorkspace.apprenticeship')],
    ['autre', t('applicationWorkspace.other')],
  ] as const;
  const app = workspace.application;
  const [recruiter, setRecruiter] = useState<EntitySearchOption | null>({
    id: app.etablissement_id,
    label: workspace.organization.name,
    detail: workspace.organization.type,
  });
  const [finalCustomer, setFinalCustomer] = useState<EntitySearchOption | null>(
    workspace.final_customer
      ? {
          id: workspace.final_customer.id,
          label: workspace.final_customer.name,
        }
      : null,
  );
  const [form, setForm] = useState({
    poste: app.poste,
    statut: app.statut,
    type_contrat: app.type_contrat ?? '',
    source: app.source ?? '',
    url_offre: app.url_offre ?? '',
    date_candidature: app.date_candidature?.slice(0, 10) ?? '',
    salaire_vise: app.salaire_vise ? String(app.salaire_vise) : '',
    tjm_vise: app.tjm_vise ? String(app.tjm_vise) : '',
    description: app.description ?? '',
    notes: app.notes ?? '',
  });
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchOrganizations = useCallback(
    async (query: string) =>
      (await organizationService.searchWorkflow(query)).map((item) => ({
        id: item.id,
        label: item.nom,
        detail: item.type,
      })),
    [],
  );
  const createFinalCustomer = useCallback(
    async (name: string) => {
      const item = await organizationService.createWorkflow({
        nom: name,
        type: 'CLIENT_FINAL',
      });
      return {
        id: item.id,
        label: item.nom,
        detail: t('applicationWorkspace.finalCustomer'),
      };
    },
    [t],
  );
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recruiter) return;
    setLoading(true);
    setError('');
    try {
      await applicationService.updateWorkflowDetails(app.id, {
        poste: form.poste,
        statut: form.statut,
        type_contrat: form.type_contrat || null,
        etablissement_id: String(recruiter.id),
        client_final_id: finalCustomer ? String(finalCustomer.id) : null,
        source: form.source || null,
        url_offre: form.url_offre || null,
        date_candidature: form.date_candidature
          ? new Date(`${form.date_candidature}T12:00:00`).toISOString()
          : null,
        salaire_vise:
          form.type_contrat === 'freelance'
            ? null
            : form.salaire_vise
              ? Number(form.salaire_vise)
              : null,
        tjm_vise:
          form.type_contrat === 'freelance'
            ? form.tjm_vise
              ? Number(form.tjm_vise)
              : null
            : null,
        description: form.description || null,
        notes: form.notes || null,
      });
      onSaved();
    } catch {
      setError(t('applicationWorkspace.saveError'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog
      eyebrow={t('applicationWorkspace.file')}
      title={t('applicationWorkspace.editingTitle')}
      onClose={onClose}
    >
      <form className={classes.form} onSubmit={submit}>
        {error && <p className={classes.error}>{error}</p>}
        <div className={classes.grid}>
          <TextField
            label={t('applicationWorkspace.position')}
            required
            value={form.poste}
            onChange={(event) => set('poste', event.target.value)}
          />
          <SelectField
            label={t('applicationWorkspace.status')}
            value={form.statut}
            onChange={(event) => set('statut', event.target.value)}
            options={statuses}
          />
          <SelectField
            label={t('applicationWorkspace.contractType')}
            value={form.type_contrat}
            onChange={(event) => set('type_contrat', event.target.value)}
            options={contracts}
          />
        </div>
        <div className={classes.grid}>
          <EntitySearchField
            label={t('applicationWorkspace.recruiterCompany')}
            value={recruiter}
            onSearch={searchOrganizations}
            onSelect={setRecruiter}
            onClear={() => setRecruiter(null)}
            placeholder={t('applicationWorkspace.searchCompany')}
          />
          <EntitySearchField
            label={t('applicationWorkspace.finalCustomer')}
            hint={t('applicationWorkspace.finalCustomerSearchHint')}
            value={finalCustomer}
            onSearch={searchOrganizations}
            onSelect={(option) => {
              if (String(option.id) !== String(recruiter?.id))
                setFinalCustomer(option);
            }}
            onClear={() => setFinalCustomer(null)}
            onCreate={createFinalCustomer}
            createLabel={(name) =>
              t('applicationWorkspace.createFinalCustomer').replace(
                '{name}',
                name,
              )
            }
            placeholder={t('applicationWorkspace.searchFinalCustomer')}
          />
        </div>
        <button
          className={classes.disclosure}
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {t(
            expanded
              ? 'applicationWorkspace.hideDetails'
              : 'applicationWorkspace.showExtraDetails',
          )}{' '}
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
        {expanded && (
          <>
            <div className={classes.grid}>
              <TextField
                label={t('applicationWorkspace.source')}
                value={form.source}
                onChange={(event) => set('source', event.target.value)}
              />
              <TextField
                label={t('applicationWorkspace.applicationDate')}
                type="date"
                value={form.date_candidature}
                onChange={(event) =>
                  set('date_candidature', event.target.value)
                }
              />
              {form.type_contrat === 'freelance' ? (
                <TextField
                  label={t('applicationWorkspace.targetDayRateWithUnit')}
                  type="number"
                  min="0"
                  value={form.tjm_vise}
                  onChange={(event) => set('tjm_vise', event.target.value)}
                />
              ) : (
                <TextField
                  label={t('applicationWorkspace.targetSalaryWithUnit')}
                  type="number"
                  min="0"
                  value={form.salaire_vise}
                  onChange={(event) => set('salaire_vise', event.target.value)}
                />
              )}
              <TextField
                label={t('applicationWorkspace.offerLink')}
                type="url"
                value={form.url_offre}
                onChange={(event) => set('url_offre', event.target.value)}
              />
            </div>
            <TextAreaField
              label={t('applicationWorkspace.offerDescription')}
              rows={3}
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
            />
            <TextAreaField
              label={t('applicationWorkspace.privateNotes')}
              rows={3}
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
            />
          </>
        )}
        <footer className={classes.footer}>
          <ActionButton onClick={onClose}>{t('common.cancel')}</ActionButton>
          <ActionButton
            variant="primary"
            type="submit"
            disabled={loading || !recruiter}
          >
            {loading
              ? t('applicationWorkspace.saving')
              : t('applicationWorkspace.save')}
          </ActionButton>
        </footer>
      </form>
    </Dialog>
  );
}
