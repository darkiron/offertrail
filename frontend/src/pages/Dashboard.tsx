import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { dashboardService } from '../services/api/dashboard';
import type { TodayAction } from '@entities/application/model';
import { applicationKeys } from '@entities/application/queryKeys';
import { useTodayQuery } from '@features/applications/dashboard/useTodayQuery';
import classes from './Dashboard.module.scss';
import { ActionButton } from '../components/atoms/Action';
import { SelectField } from '../components/atoms/FormField';
import { StatePanel } from '../components/molecules/StatePanel';
import { Dialog } from '../components/molecules/Dialog';
import { useI18n } from '../i18n';

const errorStatus = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status;
const interpolate = (value: string, count: number) =>
  value.replace('{count}', String(count));

function ActionDialog({
  action,
  onClose,
}: {
  action: TodayAction;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState('no_response');
  const [note, setNote] = useState('');
  const [next, setNext] = useState('3');
  const mutation = useMutation({
    mutationFn: () =>
      dashboardService.completeAction(action.id, {
        outcome,
        note: note.trim() || undefined,
        next_action:
          next === 'none'
            ? null
            : {
                due_at: new Date(
                  Date.now() + Number(next) * 86400000,
                ).toISOString(),
              },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationKeys.today(),
      });
      onClose();
    },
  });
  return (
    <Dialog
      eyebrow={t('dashboard.actionEyebrow')}
      title={t('dashboard.actionTitle')}
      onClose={onClose}
    >
      <fieldset className={classes.outcomes}>
        <legend>{t('dashboard.outcomeLegend')}</legend>
        {[
          ['no_response', t('dashboard.outcomeNoResponse')],
          ['response_received', t('dashboard.outcomeResponse')],
          ['conversation_held', t('dashboard.outcomeConversation')],
          ['other', t('dashboard.outcomeOther')],
        ].map(([value, label]) => (
          <label
            key={value}
            className={outcome === value ? classes.selected : ''}
          >
            <input
              type="radio"
              name="outcome"
              value={value}
              checked={outcome === value}
              onChange={() => setOutcome(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className={classes.field}>
        {t('dashboard.optionalNote')}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('dashboard.notePlaceholder')}
        />
      </label>
      <SelectField
        className={classes.field}
        label={t('dashboard.nextStep')}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        options={[
          ['3', t('dashboard.inThreeDays')],
          ['7', t('dashboard.inOneWeek')],
          ['none', t('dashboard.noNextStep')],
        ]}
      />
      {mutation.isError ? (
        <p className={classes.error} role="alert">
          {t('dashboard.saveError')}
        </p>
      ) : null}
      <footer className={classes.dialogFooter}>
        <ActionButton onClick={onClose}>{t('common.cancel')}</ActionButton>
        <ActionButton
          variant="primary"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? t('dashboard.saving') : t('dashboard.save')}
        </ActionButton>
      </footer>
    </Dialog>
  );
}

export function Dashboard() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const { openCreateApplication } = useOutletContext<{
    openCreateApplication: () => void;
  }>();
  const [selected, setSelected] = useState<TodayAction | null>(null);
  const query = useTodayQuery();
  useEffect(() => {
    document.title = t('dashboard.todayTitle');
  }, [t]);
  useEffect(() => {
    if (errorStatus(query.error) === 401)
      navigate('/login?next=%2Fapp', { replace: true });
  }, [navigate, query.error]);
  if (errorStatus(query.error) === 401) return null;
  if (query.isLoading)
    return (
      <main className={classes.page}>
        <div className={classes.skeleton} />
        <div className={classes.skeletonCard} />
      </main>
    );
  if (query.isError || !query.data) {
    const forbidden = errorStatus(query.error) === 403;
    return (
      <main className={classes.page}>
        <StatePanel
          title={t(
            forbidden ? 'dashboard.forbiddenTitle' : 'dashboard.loadErrorTitle',
          )}
          description={forbidden ? t('dashboard.forbiddenCopy') : undefined}
        >
          {forbidden ? null : (
            <ActionButton variant="primary" onClick={() => query.refetch()}>
              {t('common.retry')}
            </ActionButton>
          )}
        </StatePanel>
      </main>
    );
  }
  const data = query.data;
  if (data.activation.state === 'onboarding')
    return (
      <main className={classes.page}>
        <p className={classes.eyebrow}>{t('dashboard.welcome')}</p>
        <h1>{t('dashboard.onboardingTitle')}</h1>
        <p className={classes.lede}>{t('dashboard.onboardingCopy')}</p>
        <div className={classes.onboarding}>
          <ActionButton variant="primary" onClick={openCreateApplication}>
            {t('dashboard.addApplication')}
          </ActionButton>
          <ActionButton onClick={() => navigate('/app/import')}>
            {t('dashboard.importFile')}
          </ActionButton>
        </div>
      </main>
    );
  const [priority, ...following] = data.actions.items;
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const statusLabels: Record<string, string> = {
    en_attente: t('statut.en_attente'),
    envoyee: t('statut.envoyee'),
    entretien: t('statut.entretien'),
    offre_recue: t('statut.offre_recue'),
    refusee: t('statut.refusee'),
  };
  return (
    <main className={classes.page}>
      <header className={classes.pageHead}>
        <div>
          <p className={classes.eyebrow}>{dateLabel.format(new Date())}</p>
          <h1>
            {data.actions.due_count
              ? interpolate(
                  t(
                    data.actions.due_count === 1
                      ? 'dashboard.attentionSingular'
                      : 'dashboard.attentionPlural',
                  ),
                  data.actions.due_count,
                )
              : t('dashboard.allCaughtUp')}
          </h1>
          <p className={classes.lede}>
            {t(
              data.actions.due_count
                ? 'dashboard.urgentFirst'
                : 'dashboard.nextDeadlineVisible',
            )}
          </p>
        </div>
        <ActionButton variant="primary" onClick={openCreateApplication}>
          {t('dashboard.applicationsShortcut')}
        </ActionButton>
      </header>
      <div className={classes.grid}>
        <section>
          <div className={classes.sectionTitle}>
            <h2>{t('dashboard.doNow')}</h2>
            <span>
              {data.actions.due_count
                ? interpolate(t('dashboard.oneOf'), data.actions.due_count)
                : t('dashboard.noDueAction')}
            </span>
          </div>
          {priority ? (
            <>
              <article className={classes.priority}>
                <div className={classes.priorityMeta}>
                  <span>
                    {t(
                      priority.urgency === 'overdue'
                        ? 'dashboard.overdue'
                        : 'dashboard.scheduled',
                    )}
                  </span>
                  <span>
                    {statusLabels[priority.application.status] ??
                      t('applicationWorkspace.unknownStatus')}
                  </span>
                </div>
                <h2>{priority.application.title}</h2>
                <p className={classes.company}>{priority.organization.name}</p>
                <p>{t('dashboard.reviewContext')}</p>
                <div className={classes.actions}>
                  <button
                    onClick={() =>
                      navigate(`/app/candidatures/${priority.application.id}`)
                    }
                  >
                    {t('dashboard.openFile')}
                  </button>
                  <button onClick={() => setSelected(priority)}>
                    {t('dashboard.markComplete')}
                  </button>
                </div>
              </article>
              {following.map((action) => (
                <button
                  className={classes.queue}
                  key={action.id}
                  onClick={() =>
                    navigate(`/app/candidatures/${action.application.id}`)
                  }
                >
                  <span>
                    <strong>{action.application.title}</strong>
                    <small>{action.organization.name}</small>
                  </span>
                  <time dateTime={action.due_at}>
                    {new Date(action.due_at).toLocaleDateString(locale)}
                  </time>
                </button>
              ))}
            </>
          ) : (
            <div className={classes.empty}>{t('dashboard.noPending')}</div>
          )}
        </section>
        <aside>
          <h2>{t('dashboard.searchSummary')}</h2>
          <dl>
            <div>
              <dt>{data.summary.active_applications}</dt>
              <dd>{t('dashboard.activeApplications')}</dd>
            </div>
            <div>
              <dt>{data.summary.responses_30d}</dt>
              <dd>{t('dashboard.responses30d')}</dd>
            </div>
            <div>
              <dt>{data.summary.interviews_30d}</dt>
              <dd>{t('dashboard.interviews30d')}</dd>
            </div>
          </dl>
        </aside>
      </div>
      {selected ? (
        <ActionDialog action={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  );
}
