import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApplicationsQuery } from '@features/applications/list/useApplicationsQuery';
import { useListingController } from '../hooks/useListingController';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import classes from './ApplicationsPage.module.scss';
import { SearchField, SelectField } from '../components/atoms/FormField';
import { ActionButton } from '../components/atoms/Action';
import {
  EntityIdentity,
  EntityValue,
} from '../components/molecules/EntityList';
import { PageHeader } from '../components/molecules/PageHeader';
import { FilterBar } from '../components/molecules/FilterBar';
import { PortfolioListing } from '../components/organisms/PortfolioListing';
import { StatePanel } from '../components/molecules/StatePanel';
import { useI18n } from '../i18n';

type FilterOption = readonly [value: string, label: string];

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}
const interpolate = (value: string, count: number) =>
  value.replace('{count}', String(count));
const errorStatus = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status;

export function ApplicationsPage() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const listing = useListingController('/app/candidatures', {
    sort: 'created_at',
  });
  const [showCreate, setShowCreate] = useState(false);
  const resultsTitle = useRef<HTMLDivElement>(null);
  const status = listing.value('status');
  const due = listing.value('due');
  const sort = listing.value('sort');
  const includeClosed = listing.value('closed') === '1';
  const statusOptions: readonly FilterOption[] = [
    ['', t('applications.allStatuses')],
    ['en_attente', t('statut.en_attente')],
    ['envoyee', t('statut.envoyee')],
    ['entretien', t('statut.entretien')],
    ['offre_recue', t('statut.offre_recue')],
    ['refusee', t('statut.refusee')],
  ];
  const dueOptions: readonly FilterOption[] = [
    ['', t('applications.allDeadlines')],
    ['overdue', t('applications.overdue')],
    ['today', t('applications.today')],
    ['week', t('applications.thisWeek')],
    ['none', t('applications.noNextAction')],
  ];
  const sortOptions: readonly FilterOption[] = [
    ['created_at', t('applications.recentlyAdded')],
    ['priority', t('applications.actionPriority')],
    ['applied_at', t('applications.applicationDate')],
    ['updated_at', t('applications.recentActivity')],
  ];
  const statusLabel = (value: string) =>
    statusOptions.find(([option]) => option === value)?.[1] ??
    value.replaceAll('_', ' ');
  const actionLabel = (action: { due_at: string; urgency: string } | null) =>
    !action
      ? t('applications.nothingPlanned')
      : action.urgency === 'overdue'
        ? `${t('applications.overdue')} · ${formatDate(action.due_at, locale)}`
        : action.urgency === 'today'
          ? t('applications.today')
          : formatDate(action.due_at, locale);

  const params = useMemo(
    () => ({
      q: listing.query || undefined,
      status: status || undefined,
      due: due || undefined,
      sort,
      page: listing.page,
      per_page: 15,
      include_closed: includeClosed || status === 'refusee',
    }),
    [listing.query, listing.page, status, due, sort, includeClosed],
  );
  const query = useApplicationsQuery(params);
  const data = query.data;
  const hasFilters = Boolean(params.q || status || due || includeClosed);

  useEffect(() => {
    document.title = t('application.pageTitle');
  }, [t]);
  useEffect(() => {
    const restoreScrollY = (
      location.state as { restoreScrollY?: number } | null
    )?.restoreScrollY;
    if (typeof restoreScrollY === 'number')
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: restoreScrollY }),
      );
  }, [location.state]);
  const clearFilters = listing.clear;
  const openRow = (id: string) =>
    navigate(`/app/candidatures/${id}`, {
      state: {
        from: `${location.pathname}${location.search}`,
        scrollY: window.scrollY,
      },
    });

  useEffect(() => {
    if (errorStatus(query.error) === 401)
      navigate(
        `/login?next=${encodeURIComponent(location.pathname + location.search)}`,
        { replace: true },
      );
  }, [query.error, location.pathname, location.search, navigate]);
  if (errorStatus(query.error) === 401) return null;
  if (errorStatus(query.error) === 403)
    return (
      <main className={classes.page}>
        <StatePanel title={t('applications.forbidden')} />
      </main>
    );
  if (errorStatus(query.error) === 404)
    return (
      <main className={classes.page}>
        <StatePanel title={t('applications.notFound')} />
      </main>
    );

  return (
    <main className={classes.page} aria-busy={query.isFetching}>
      {showCreate && (
        <NewApplicationModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void query.refetch();
          }}
        />
      )}
      <PageHeader
        variant="saas"
        kicker={t('applications.portfolio')}
        title={t('applications.title')}
        description={t('applications.description')}
        actions={
          <ActionButton variant="primary" onClick={() => setShowCreate(true)}>
            {t('applications.add')}
          </ActionButton>
        }
      />
      <FilterBar
        label={t('applications.filters')}
        columns="minmax(220px,1.5fr) repeat(3,minmax(140px,.65fr))"
      >
        <SearchField
          className={classes.search}
          label={t('applications.search')}
          value={listing.search}
          onChange={(event) => listing.setSearch(event.target.value)}
          placeholder={t('applications.searchPlaceholder')}
        />
        <SelectField
          label={t('applications.status')}
          value={status}
          onChange={(event) => listing.update('status', event.target.value)}
          options={statusOptions}
        />
        <SelectField
          label={t('applications.due')}
          value={due}
          onChange={(event) => listing.update('due', event.target.value)}
          options={dueOptions}
        />
        <SelectField
          label={t('applications.sort')}
          value={sort}
          onChange={(event) => listing.update('sort', event.target.value)}
          options={sortOptions}
        />
        <label className={classes.closed}>
          <input
            type="checkbox"
            checked={includeClosed}
            onChange={(event) =>
              listing.update('closed', event.target.checked ? '1' : '')
            }
          />{' '}
          {t('applications.includeDeclined')}
        </label>
      </FilterBar>

      <div ref={resultsTitle} tabIndex={-1}>
        <PortfolioListing
          label={t('applications.title')}
          headings={[
            t('applications.headingIdentity'),
            t('applications.headingStatus'),
            t('applications.headingNextAction'),
            t('applications.headingLastSignal'),
          ]}
          data={data}
          loading={query.isLoading}
          fetching={query.isFetching}
          error={query.isError}
          summary={interpolate(
            t(
              data?.total === 1
                ? 'applications.countSingular'
                : 'applications.countPlural',
            ),
            data?.total ?? 0,
          )}
          summaryAction={
            hasFilters ? (
              <ActionButton variant="quiet" onClick={clearFilters}>
                {t('applications.clearFilters')}
              </ActionButton>
            ) : undefined
          }
          loadingLabel={t('applications.loading')}
          errorTitle={t('applications.error')}
          emptyTitle={t(
            hasFilters ? 'applications.emptyFiltered' : 'applications.empty',
          )}
          emptyDescription={t(
            hasFilters
              ? 'applications.emptyFilteredCopy'
              : 'applications.emptyCopy',
          )}
          emptyAction={
            hasFilters ? (
              <ActionButton onClick={clearFilters}>
                {t('applications.clearFilters')}
              </ActionButton>
            ) : (
              <ActionButton
                variant="primary"
                onClick={() => setShowCreate(true)}
              >
                {t('applications.add')}
              </ActionButton>
            )
          }
          getKey={(item) => item.id}
          onOpen={(item) => openRow(item.id)}
          renderCells={(item) => (
            <>
              <EntityIdentity
                title={item.poste}
                detail={item.organization.name}
              />
              <EntityValue value={statusLabel(item.statut)} />
              <EntityValue
                value={actionLabel(item.next_action)}
                tone={
                  item.next_action?.urgency === 'overdue' ? 'danger' : 'default'
                }
              />
              <EntityValue
                value={
                  item.last_event
                    ? statusLabel(item.last_event.kind)
                    : t('applications.noActivity')
                }
                detail={
                  item.last_event
                    ? formatDate(item.last_event.occurred_at, locale)
                    : undefined
                }
                tone={item.last_event ? 'default' : 'muted'}
              />
            </>
          )}
          onRetry={() => void query.refetch()}
          getPageHref={listing.pageHref}
          onPageChange={() =>
            window.requestAnimationFrame(() => resultsTitle.current?.focus())
          }
        />
      </div>
    </main>
  );
}
