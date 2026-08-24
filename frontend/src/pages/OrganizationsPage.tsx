import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  relationshipApi,
  relationshipKeys,
} from '../features/relationships/queries';
import {
  useListingController,
  usePaginatedListing,
} from '../hooks/useListingController';
import classes from './OrganizationsPage.module.scss';
import { SearchField, SelectField } from '../components/atoms/FormField';
import { ActionButton, ActionLink } from '../components/atoms/Action';
import {
  EntityIdentity,
  EntityValue,
} from '../components/molecules/EntityList';
import { PageHeader } from '../components/molecules/PageHeader';
import { FilterBar } from '../components/molecules/FilterBar';
import { PortfolioListing } from '../components/organisms/PortfolioListing';
import { useI18n } from '../i18n';
import {
  formatRelationshipDate,
  normalizeRelationshipKey,
  relationshipErrorStatus,
  relationshipCopy,
} from '../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../features/relationships/auth';

export const OrganizationsPage = () => {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const copy = relationshipCopy(locale);
  const c = copy.organizations;
  const location = useLocation();
  const listing = useListingController('/app/etablissements', {
    sort: 'recent',
  });
  const role = listing.value('role');
  const sort = listing.value('sort');
  const result = usePaginatedListing(
    relationshipKeys.organizationPortfolio({
      page: listing.page,
      q: listing.query,
      role,
      sort,
    }),
    () =>
      relationshipApi.organizationPortfolio({
        page: listing.page,
        per_page: 15,
        q: listing.query || undefined,
        relationship_role: role || undefined,
        sort,
      }),
  );
  const data = result.data;
  useRelationshipAuthRedirect(result.error);
  useEffect(() => {
    document.title = c.pageTitle;
  }, [c.pageTitle]);
  useEffect(() => {
    const scrollY = (location.state as { restoreScrollY?: number } | null)
      ?.restoreScrollY;
    if (typeof scrollY === 'number')
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
  }, [location.state]);

  return (
    <main className={classes.page}>
      <PageHeader
        variant="saas"
        kicker={c.kicker}
        title={c.title}
        description={c.description}
        actions={
          <ActionLink to="/app/etablissements/maintenance">
            {c.maintenance}
          </ActionLink>
        }
      />
      <FilterBar label={c.filters} columns="minmax(260px,1fr) 190px 220px">
        <SearchField
          className={classes.search}
          label={c.search}
          value={listing.search}
          onChange={(event) => listing.setSearch(event.target.value)}
          placeholder={c.searchPlaceholder}
        />
        <SelectField
          label={c.role}
          value={role}
          onChange={(event) => listing.update('role', event.target.value)}
          options={[
            ['', c.allRoles],
            ['intermediary', c.intermediary],
            ['client_final', c.finalClient],
          ]}
        />
        <SelectField
          label={c.sort}
          value={sort}
          onChange={(event) => listing.update('sort', event.target.value)}
          options={[
            ['recent', c.recent],
            ['applications', c.applicationCount],
            ['name', c.nameSort],
          ]}
        />
      </FilterBar>

      <PortfolioListing
        label={c.list}
        headings={[c.title, c.relation, c.responses, c.lastActivity]}
        data={data}
        loading={result.isLoading}
        fetching={result.isFetching}
        error={result.isError && relationshipErrorStatus(result.error) !== 401}
        summary={
          <>
            <strong>{data?.total ?? '—'}</strong>{' '}
            {data?.total === 1 ? c.singular : c.plural}
          </>
        }
        summaryAction={
          listing.query || role || sort !== 'recent' ? (
            <ActionButton variant="quiet" onClick={listing.clear}>
              {c.reset}
            </ActionButton>
          ) : undefined
        }
        loadingLabel={c.loading}
        errorTitle={c.error}
        emptyTitle={listing.query || role ? c.emptyFiltered : c.empty}
        emptyDescription={
          listing.query || role
            ? c.emptyFilteredDescription
            : c.emptyDescription
        }
        getKey={(organization) => organization.id}
        onOpen={(organization) =>
          navigate(`/app/etablissements/${organization.id}`, {
            state: {
              from: `${location.pathname}${location.search}`,
              scrollY: window.scrollY,
            },
          })
        }
        renderCells={(organization) => (
          <>
            <EntityIdentity
              title={organization.name}
              detail={
                copy.types[
                  normalizeRelationshipKey(
                    organization.type,
                  ) as keyof typeof copy.types
                ] ?? organization.type
              }
            />
            <EntityValue
              value={organization.applications_count}
              detail={copy.common.applications}
            />
            <EntityValue
              value={`${organization.response_rate}%`}
              detail={`${organization.responses_count} ${c.responses}`}
            />
            <EntityValue
              value={
                <time dateTime={organization.updated_at}>
                  {formatRelationshipDate(
                    organization.updated_at,
                    locale,
                    copy.common.missing,
                  )}
                </time>
              }
            />
          </>
        )}
        onRetry={() => void result.refetch()}
        getPageHref={listing.pageHref}
        onPageChange={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </main>
  );
};
