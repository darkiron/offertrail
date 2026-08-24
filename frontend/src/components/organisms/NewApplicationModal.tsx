import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { Dialog } from '../molecules/Dialog';
import { applicationService } from '../../services/api/applications';
import {
  organizationService,
  type WorkflowOrganization,
} from '../../services/api/organizations';
import classes from './NewApplicationModal.module.scss';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}
const fill = (value: string, name: string) => value.replace('{name}', name);

export function NewApplicationModal({ onClose, onCreated }: Props) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const loginPath = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  const [organizations, setOrganizations] = useState<WorkflowOrganization[]>(
    [],
  );
  const [poste, setPoste] = useState('');
  const [company, setCompany] = useState('');
  const [finalCustomer, setFinalCustomer] = useState('');
  const [status, setStatus] = useState('envoyee');
  const [contractType, setContractType] = useState('');
  const [appliedAt, setAppliedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [nextAction, setNextAction] = useState('');
  const [source, setSource] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sameName = (left: string, right: string) =>
    left.localeCompare(right, locale, { sensitivity: 'base' }) === 0;
  useEffect(() => {
    organizationService
      .getWorkflowAll()
      .then(setOrganizations)
      .catch((caught: unknown) => {
        if (axios.isAxiosError(caught) && caught.response?.status === 401) {
          onClose();
          navigate(loginPath, { replace: true });
          return;
        }
        setError(t('applicationWorkspace.companyLoadError'));
      });
  }, [loginPath, navigate, onClose, t]);
  const suggestions = useMemo(() => {
    const needle = company.trim().toLocaleLowerCase(locale);
    return organizations
      .filter(
        (item) =>
          !needle || item.nom.toLocaleLowerCase(locale).includes(needle),
      )
      .slice(0, 8);
  }, [company, locale, organizations]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!poste.trim() || !company.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let organization = organizations.find((item) =>
        sameName(item.nom, company.trim()),
      );
      if (!organization)
        organization = await organizationService.createWorkflow({
          nom: company.trim(),
          type: 'AUTRE',
        });
      let finalOrganization = finalCustomer.trim()
        ? organizations.find((item) => sameName(item.nom, finalCustomer.trim()))
        : undefined;
      if (finalCustomer.trim() && !finalOrganization)
        finalOrganization = await organizationService.createWorkflow({
          nom: finalCustomer.trim(),
          type: 'AUTRE',
        });
      const application = await applicationService.createWorkflowApplication({
        etablissement_id: organization.id,
        client_final_id: finalOrganization?.id ?? null,
        poste: poste.trim(),
        statut: status,
        date_candidature: appliedAt
          ? new Date(`${appliedAt}T12:00:00`).toISOString()
          : null,
        source: source.trim() || null,
        url_offre: jobUrl.trim() || null,
        type_contrat: contractType || null,
      });
      if (nextAction)
        await applicationService.scheduleWorkflowAction(application.id, {
          due_at: new Date(`${nextAction}T12:00:00`).toISOString(),
          channel: 'email',
        });
      onCreated();
    } catch (caught: unknown) {
      if (axios.isAxiosError(caught) && caught.response?.status === 402) {
        onClose();
        navigate('/app/mon-compte?reason=limit_reached');
        return;
      }
      if (axios.isAxiosError(caught) && caught.response?.status === 401) {
        onClose();
        navigate(loginPath, { replace: true });
        return;
      }
      setError(
        axios.isAxiosError(caught)
          ? (caught.response?.data?.detail ??
              t('applicationWorkspace.createError'))
          : t('applicationWorkspace.createError'),
      );
    } finally {
      setLoading(false);
    }
  };
  const isNewCompany =
    company &&
    !organizations.some((item) => sameName(item.nom, company.trim()));
  return (
    <Dialog
      eyebrow={t('applicationWorkspace.newEyebrow')}
      title={t('applicationWorkspace.newTitle')}
      onClose={loading ? () => undefined : onClose}
    >
      <form className={classes.form} onSubmit={submit}>
        <div className={classes.core}>
          <label>
            <span className={classes.labelText}>
              {t('applicationWorkspace.position')} <b aria-hidden="true">*</b>
            </span>
            <input
              autoFocus
              required
              value={poste}
              onChange={(event) => setPoste(event.target.value)}
              placeholder={t('applicationWorkspace.positionPlaceholder')}
            />
          </label>
          <label className={classes.companyField}>
            <span className={classes.labelText}>
              {t('applicationWorkspace.company')} <b aria-hidden="true">*</b>
            </span>
            <input
              required
              value={company}
              onFocus={() => setSuggestionsOpen(true)}
              onChange={(event) => {
                setCompany(event.target.value);
                setSuggestionsOpen(true);
              }}
              placeholder={t('applicationWorkspace.companyPlaceholder')}
              autoComplete="off"
            />
            {suggestionsOpen && company.trim() && suggestions.length ? (
              <div className={classes.suggestions}>
                {suggestions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setCompany(item.nom);
                      setSuggestionsOpen(false);
                    }}
                  >
                    <strong>{item.nom}</strong>
                    <span>
                      {item.type.replaceAll('_', ' ').toLocaleLowerCase(locale)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <small>
              {isNewCompany
                ? fill(t('applicationWorkspace.newCompany'), company)
                : t('applicationWorkspace.companyHint')}
            </small>
          </label>
          <label>
            <span className={classes.labelText}>
              {t('applicationWorkspace.finalCustomer')}{' '}
              <em>{t('applicationWorkspace.ifKnown')}</em>
            </span>
            <input
              list="final-customer-organizations"
              value={finalCustomer}
              onChange={(event) => setFinalCustomer(event.target.value)}
              placeholder={t('applicationWorkspace.finalCustomerPlaceholder')}
              autoComplete="off"
            />
            <datalist id="final-customer-organizations">
              {organizations
                .filter((item) => item.nom !== company)
                .map((item) => (
                  <option key={item.id} value={item.nom} />
                ))}
            </datalist>
            <small>{t('applicationWorkspace.finalCustomerHint')}</small>
          </label>
          <div className={classes.split}>
            <label>
              <span className={classes.labelText}>
                {t('applicationWorkspace.status')}
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="en_attente">{t('statut.en_attente')}</option>
                <option value="envoyee">{t('statut.envoyee')}</option>
                <option value="entretien">{t('statut.entretien')}</option>
                <option value="offre_recue">{t('statut.offre_recue')}</option>
              </select>
            </label>
            <label>
              <span className={classes.labelText}>
                {t('applicationWorkspace.contractType')}
              </span>
              <select
                value={contractType}
                onChange={(event) => setContractType(event.target.value)}
              >
                <option value="">
                  {t('applicationWorkspace.notProvided')}
                </option>
                <option value="cdi">{t('applicationWorkspace.cdi')}</option>
                <option value="cdd">{t('applicationWorkspace.cdd')}</option>
                <option value="freelance">
                  {t('applicationWorkspace.freelance')}
                </option>
                <option value="stage">
                  {t('applicationWorkspace.internship')}
                </option>
                <option value="alternance">
                  {t('applicationWorkspace.apprenticeship')}
                </option>
                <option value="autre">{t('applicationWorkspace.other')}</option>
              </select>
            </label>
          </div>
          <label>
            <span className={classes.labelText}>
              {t('applicationWorkspace.applicationDate')}
            </span>
            <input
              type="date"
              value={appliedAt}
              onChange={(event) => setAppliedAt(event.target.value)}
            />
          </label>
          <label className={classes.next}>
            <span className={classes.labelText}>
              {t('applicationWorkspace.nextFollowUp')}{' '}
              <em>{t('applicationWorkspace.optional')}</em>
            </span>
            <input
              type="date"
              value={nextAction}
              min={appliedAt || undefined}
              onChange={(event) => setNextAction(event.target.value)}
            />
            <small>{t('applicationWorkspace.nextFollowUpHint')}</small>
          </label>
        </div>
        <button
          className={classes.detailsToggle}
          type="button"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {t(
            detailsOpen
              ? 'applicationWorkspace.hideDetails'
              : 'applicationWorkspace.addDetails',
          )}{' '}
          <span aria-hidden="true">{detailsOpen ? '−' : '+'}</span>
        </button>
        {detailsOpen ? (
          <div className={classes.details}>
            <label>
              <span className={classes.labelText}>
                {t('applicationWorkspace.source')}
              </span>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder={t('applicationWorkspace.sourcePlaceholder')}
              />
            </label>
            <label>
              <span className={classes.labelText}>
                {t('applicationWorkspace.offerLink')}
              </span>
              <input
                type="url"
                value={jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                placeholder={t('applicationWorkspace.urlPlaceholder')}
              />
            </label>
          </div>
        ) : null}
        {error ? (
          <p className={classes.error} role="alert">
            {error}
          </p>
        ) : null}
        <footer>
          <button type="button" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || !poste.trim() || !company.trim()}
          >
            {loading
              ? t('applicationWorkspace.creating')
              : nextAction
                ? t('applicationWorkspace.createAndSchedule')
                : t('applicationWorkspace.create')}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
