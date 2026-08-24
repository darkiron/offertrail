import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { applicationService, dashboardService } from '../services/api';
import classes from './ApplicationDetails.module.scss';
import { ActionButton, ExternalAction } from '@shared/ui/Action';
import { SelectField, TextAreaField, TextField } from '@shared/ui/FormField';
import { LoadingStatus } from '@shared/ui/LoadingStatus';
import { DetailSummary } from '@shared/ui/DetailSummary';
import { DetailHeader } from '@shared/ui/DetailHeader';
import { Dialog } from '@shared/ui/Dialog';
import { WorkflowApplicationEditModal } from '@widgets/applications/WorkflowApplicationEditModal';
import { EntityLink } from '@shared/ui/EntityLink';
import { StatePanel } from '@shared/ui/StatePanel';
import { useI18n } from '../i18n';
import { useApplicationWorkspaceQuery } from '@features/applications/detail/useApplicationWorkspaceQuery';
import { applicationKeys } from '@entities/application/queryKeys';

function formatDate(
  value: string | null | undefined,
  locale: string,
  withTime = false,
) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(
    locale,
    withTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' },
  ).format(new Date(value));
}
const errorStatus = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status;

export function ApplicationDetails() {
  const { locale, t } = useI18n();
  const statusLabels: Record<string, string> = {
    en_attente: t('statut.en_attente'),
    envoyee: t('statut.envoyee'),
    entretien: t('statut.entretien'),
    offre_recue: t('statut.offre_recue'),
    refusee: t('statut.refusee'),
  };
  const eventLabels: Record<string, string> = {
    creation: t('applicationWorkspace.eventCreated'),
    modification: t('applicationWorkspace.eventUpdated'),
    changement_statut: t('applicationWorkspace.eventStatus'),
    note: t('applicationWorkspace.eventNote'),
    relance: t('applicationWorkspace.eventFollowUp'),
    followup_completed: t('applicationWorkspace.eventFollowUpCompleted'),
  };
  const contractLabels: Record<string, string> = {
    cdi: t('applicationWorkspace.cdi'),
    cdd: t('applicationWorkspace.cdd'),
    freelance: t('applicationWorkspace.freelance'),
    stage: t('applicationWorkspace.internship'),
    alternance: t('applicationWorkspace.apprenticeship'),
    autre: t('applicationWorkspace.other'),
  };
  const fill = (value: string, name: string) => value.replace('{name}', name);
  const count = (value: string, amount: number) =>
    value.replace('{count}', String(amount));
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showComplete, setShowComplete] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [outcome, setOutcome] = useState('no_response');
  const [note, setNote] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [channel, setChannel] = useState('email');
  const [editing, setEditing] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const navigationState = location.state as {
    from?: string;
    scrollY?: number;
  } | null;
  const from = navigationState?.from ?? '/app/candidatures';
  const query = useApplicationWorkspaceQuery(id);
  const complete = useMutation({
    mutationFn: () =>
      dashboardService.completeAction(query.data!.next_action!.id, {
        outcome,
        note: note.trim() || undefined,
      }),
    onSuccess: async () => {
      setShowComplete(false);
      setNote('');
      await Promise.all([
        query.refetch(),
        queryClient.invalidateQueries({ queryKey: applicationKeys.today() }),
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
      ]);
    },
  });
  const schedule = useMutation({
    mutationFn: () =>
      applicationService.scheduleWorkflowAction(id!, {
        due_at: new Date(`${dueAt}T12:00:00`).toISOString(),
        channel,
      }),
    onSuccess: async () => {
      setShowSchedule(false);
      setDueAt('');
      await Promise.all([
        query.refetch(),
        queryClient.invalidateQueries({ queryKey: applicationKeys.today() }),
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() }),
      ]);
    },
  });
  const addNote = useMutation({
    mutationFn: () => applicationService.addWorkflowNote(id!, newNote.trim()),
    onSuccess: async () => {
      setShowNote(false);
      setNewNote('');
      await query.refetch();
    },
  });

  useEffect(() => {
    if (errorStatus(query.error) === 401)
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      });
  }, [query.error, location.pathname, navigate]);
  if (errorStatus(query.error) === 401) return null;
  if (query.isLoading)
    return (
      <main className={classes.page}>
        <div className={classes.loading}>
          <LoadingStatus>{t('application.loading')}</LoadingStatus>
        </div>
      </main>
    );
  if (errorStatus(query.error) === 403)
    return (
      <main className={classes.page}>
        <StatePanel title={t('applications.forbidden')}>
          <Link to={from}>{t('application.pageHeader')}</Link>
        </StatePanel>
      </main>
    );
  if (query.isError && errorStatus(query.error) !== 404)
    return (
      <main className={classes.page}>
        <StatePanel title={t('application.detailError')}>
          <ActionButton onClick={() => query.refetch()}>
            {t('common.retry')}
          </ActionButton>
        </StatePanel>
      </main>
    );
  if (!query.data)
    return (
      <main className={classes.page}>
        <StatePanel title={t('applications.notFound')}>
          <Link to={from}>{t('application.pageHeader')}</Link>
        </StatePanel>
      </main>
    );

  const {
    application,
    organization,
    final_customer: finalCustomer,
    contacts,
    next_action: nextAction,
    timeline,
  } = query.data;
  const primaryContact = contacts[0];
  const currentDetailPath = `${location.pathname}${location.search}`;
  return (
    <main className={classes.page}>
      {editing && (
        <WorkflowApplicationEditModal
          workspace={query.data}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void Promise.all([
              query.refetch(),
              queryClient.invalidateQueries({
                queryKey: applicationKeys.today(),
              }),
              queryClient.invalidateQueries({
                queryKey: applicationKeys.lists(),
              }),
            ]);
          }}
        />
      )}
      <DetailHeader
        backTo={from}
        backLabel={t('applicationWorkspace.back')}
        backState={{ restoreScrollY: navigationState?.scrollY }}
        eyebrow={t('applicationWorkspace.file')}
        title={application.poste}
        subtitle={organization.name}
        badges={
          <span>
            {statusLabels[application.statut] ??
              t('applicationWorkspace.unknownStatus')}
          </span>
        }
        actions={
          <>
            <ActionButton variant="primary" onClick={() => setEditing(true)}>
              {t('applicationWorkspace.edit')}
            </ActionButton>
            {application.url_offre && (
              <ExternalAction href={application.url_offre}>
                {t('applicationWorkspace.viewOffer')}
              </ExternalAction>
            )}
          </>
        }
      />
      <DetailSummary
        label={t('applicationWorkspace.summary')}
        items={[
          {
            label: t('applicationWorkspace.contract'),
            value: application.type_contrat
              ? (contractLabels[application.type_contrat] ??
                application.type_contrat)
              : t('applicationWorkspace.notProvided'),
          },
          {
            label: t(
              application.type_contrat === 'freelance'
                ? 'applicationWorkspace.targetDayRate'
                : 'applicationWorkspace.targetSalary',
            ),
            value:
              application.type_contrat === 'freelance'
                ? application.tjm_vise
                  ? `${application.tjm_vise.toLocaleString(locale)} € ${t('applicationWorkspace.perDay')}`
                  : t('applicationWorkspace.notProvided')
                : application.salaire_vise
                  ? `${application.salaire_vise.toLocaleString(locale)} €`
                  : t('applicationWorkspace.notProvided'),
          },
          {
            label: t('applicationWorkspace.appliedOn'),
            value: formatDate(application.date_candidature, locale),
          },
          {
            label: t('applicationWorkspace.company'),
            value: (
              <EntityLink
                to={`/app/etablissements/${organization.id}`}
                from={currentDetailPath}
              >
                {organization.name}
              </EntityLink>
            ),
          },
          {
            label: t('applicationWorkspace.finalCustomer'),
            value: finalCustomer ? (
              <EntityLink
                to={`/app/etablissements/${finalCustomer.id}`}
                from={currentDetailPath}
              >
                {finalCustomer.name}
              </EntityLink>
            ) : (
              t('applicationWorkspace.notProvided')
            ),
          },
        ]}
      />

      <section
        className={nextAction ? classes.nextAction : classes.noAction}
        aria-labelledby="next-action-title"
      >
        <p>{t('applicationWorkspace.nextAction')}</p>
        {nextAction ? (
          <>
            <h2 id="next-action-title">
              {fill(
                t('applicationWorkspace.followUpPerson'),
                primaryContact
                  ? `${primaryContact.first_name} ${primaryContact.last_name}`
                  : organization.name,
              )}
            </h2>
            <div className={classes.due}>
              {formatDate(nextAction.due_at, locale)}
              {nextAction.channel ? ` · ${nextAction.channel}` : ''}
            </div>
            <ActionButton
              variant="primary"
              onClick={() => setShowComplete(true)}
            >
              {t('applicationWorkspace.completeAction')}
            </ActionButton>
          </>
        ) : (
          <>
            <h2 id="next-action-title">
              {t('applicationWorkspace.noNextAction')}
            </h2>
            <div>{t('applicationWorkspace.noNextActionCopy')}</div>
            {application.statut !== 'refusee' && (
              <ActionButton
                variant="primary"
                onClick={() => setShowSchedule(true)}
              >
                {t('applicationWorkspace.scheduleFollowUp')}
              </ActionButton>
            )}
          </>
        )}
      </section>

      <div className={classes.content}>
        <div className={classes.context}>
          <section>
            <h2>{t('applicationWorkspace.contact')}</h2>
            {primaryContact ? (
              <address>
                <EntityLink
                  to={`/app/contacts/${primaryContact.id}`}
                  from={currentDetailPath}
                >
                  {primaryContact.first_name} {primaryContact.last_name}
                </EntityLink>
                {primaryContact.role && <span>{primaryContact.role}</span>}
                {primaryContact.email && (
                  <a href={`mailto:${primaryContact.email}`}>
                    {primaryContact.email}
                  </a>
                )}
                {primaryContact.linkedin_url && (
                  <a
                    href={primaryContact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('applicationWorkspace.linkedin')} ↗
                  </a>
                )}
              </address>
            ) : (
              <p>{t('applicationWorkspace.noContact')}</p>
            )}
          </section>
          {application.description && (
            <section>
              <h2>{t('applicationWorkspace.offerDescription')}</h2>
              <p className={classes.notes}>{application.description}</p>
            </section>
          )}
          {application.notes && (
            <section>
              <h2>{t('applicationWorkspace.privateNotes')}</h2>
              <p className={classes.notes}>{application.notes}</p>
            </section>
          )}
          <section>
            <h2>{t('applicationWorkspace.company')}</h2>
            <p>
              <EntityLink
                to={`/app/etablissements/${organization.id}`}
                from={currentDetailPath}
              >
                {organization.name}
              </EntityLink>
              <br />
              {count(
                t(
                  organization.relationship_summary.applications === 1
                    ? 'applicationWorkspace.relationApplicationsOne'
                    : 'applicationWorkspace.relationApplicationsMany',
                ),
                organization.relationship_summary.applications,
              )}{' '}
              ·{' '}
              {count(
                t(
                  organization.relationship_summary.responses === 1
                    ? 'applicationWorkspace.relationResponsesOne'
                    : 'applicationWorkspace.relationResponsesMany',
                ),
                organization.relationship_summary.responses,
              )}
            </p>
            {organization.website && (
              <a href={organization.website} target="_blank" rel="noreferrer">
                {t('applicationWorkspace.website')}
              </a>
            )}
          </section>
        </div>
        <section className={classes.timeline}>
          <div className={classes.timelineHeading}>
            <h2>{t('applicationWorkspace.history')}</h2>
            <ActionButton variant="quiet" onClick={() => setShowNote(true)}>
              {t('applicationWorkspace.addNote')}
            </ActionButton>
          </div>
          {timeline.items.length ? (
            <ol>
              {timeline.items.map((event) => (
                <li key={event.id}>
                  <time dateTime={event.created_at}>
                    {formatDate(event.created_at, locale)}
                  </time>
                  <strong>
                    {eventLabels[event.type] ??
                      t('applicationWorkspace.unknownEvent')}
                  </strong>
                  {event.contenu && <p>{event.contenu}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p>{t('applicationWorkspace.noEvents')}</p>
          )}
        </section>
      </div>

      {showComplete && nextAction && (
        <div className={classes.backdrop} role="presentation">
          <form
            className={classes.dialog}
            onSubmit={(event) => {
              event.preventDefault();
              complete.mutate();
            }}
          >
            <header>
              <div>
                <p>{t('applicationWorkspace.actionCompleted')}</p>
                <h2>{t('applicationWorkspace.outcomeQuestion')}</h2>
              </div>
              <ActionButton
                variant="quiet"
                aria-label={t('common.close')}
                onClick={() => setShowComplete(false)}
              >
                ×
              </ActionButton>
            </header>
            <SelectField
              label={t('applicationWorkspace.result')}
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              options={[
                ['no_response', t('applicationWorkspace.outcomeNoResponse')],
                [
                  'response_received',
                  t('applicationWorkspace.outcomeResponse'),
                ],
                [
                  'exchange_completed',
                  t('applicationWorkspace.outcomeExchange'),
                ],
                ['other', t('applicationWorkspace.outcomeOther')],
              ]}
            />
            <TextAreaField
              label={t('applicationWorkspace.optionalNote')}
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            {complete.isError && (
              <p className={classes.error} role="alert">
                {t('applicationWorkspace.completeError')}
              </p>
            )}
            <footer>
              <ActionButton onClick={() => setShowComplete(false)}>
                {t('common.cancel')}
              </ActionButton>
              <ActionButton
                variant="primary"
                type="submit"
                disabled={complete.isPending}
              >
                {complete.isPending
                  ? t('applicationWorkspace.saving')
                  : t('applicationWorkspace.save')}
              </ActionButton>
            </footer>
          </form>
        </div>
      )}
      {showSchedule && (
        <div className={classes.backdrop} role="presentation">
          <form
            className={classes.dialog}
            onSubmit={(event) => {
              event.preventDefault();
              if (dueAt) schedule.mutate();
            }}
          >
            <header>
              <div>
                <p>{t('applicationWorkspace.nextAction')}</p>
                <h2>{t('applicationWorkspace.scheduleTitle')}</h2>
              </div>
              <ActionButton
                variant="quiet"
                aria-label={t('common.close')}
                onClick={() => setShowSchedule(false)}
              >
                ×
              </ActionButton>
            </header>
            <TextField
              label={t('applicationWorkspace.date')}
              type="date"
              required
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <SelectField
              label={t('applicationWorkspace.channel')}
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              options={[
                ['email', t('applicationWorkspace.email')],
                ['linkedin', t('applicationWorkspace.linkedin')],
                ['telephone', t('applicationWorkspace.telephone')],
                ['autre', t('applicationWorkspace.other')],
              ]}
            />
            {schedule.isError && (
              <p className={classes.error} role="alert">
                {t('applicationWorkspace.scheduleError')}
              </p>
            )}
            <footer>
              <ActionButton onClick={() => setShowSchedule(false)}>
                {t('common.cancel')}
              </ActionButton>
              <ActionButton
                variant="primary"
                type="submit"
                disabled={schedule.isPending}
              >
                {schedule.isPending
                  ? t('applicationWorkspace.scheduling')
                  : t('applicationWorkspace.schedule')}
              </ActionButton>
            </footer>
          </form>
        </div>
      )}
      {showNote && (
        <Dialog
          eyebrow={t('applicationWorkspace.historyEyebrow')}
          title={t('applicationWorkspace.addNote')}
          onClose={() => setShowNote(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (newNote.trim()) addNote.mutate();
            }}
          >
            <TextAreaField
              autoFocus
              label={t('applicationWorkspace.note')}
              rows={6}
              required
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
            />
            {addNote.isError && (
              <p className={classes.error} role="alert">
                {t('applicationWorkspace.noteError')}
              </p>
            )}
            <footer className={classes.dialogFooter}>
              <ActionButton onClick={() => setShowNote(false)}>
                {t('common.cancel')}
              </ActionButton>
              <ActionButton
                variant="primary"
                type="submit"
                disabled={!newNote.trim() || addNote.isPending}
              >
                {addNote.isPending
                  ? t('applicationWorkspace.adding')
                  : t('applicationWorkspace.addNote')}
              </ActionButton>
            </footer>
          </form>
        </Dialog>
      )}
    </main>
  );
}
