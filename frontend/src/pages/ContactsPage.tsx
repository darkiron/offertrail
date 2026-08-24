import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  relationshipApi,
  relationshipKeys,
} from '../features/relationships/queries';
import {
  useListingController,
  usePaginatedListing,
} from '../hooks/useListingController';
import ContactCreateModal from '../components/organisms/ContactCreateModal';
import { ActionButton } from '../components/atoms/Action';
import { SearchField, SelectField } from '../components/atoms/FormField';
import { PageHeader } from '../components/molecules/PageHeader';
import { FilterBar } from '../components/molecules/FilterBar';
import {
  EntityIdentity,
  EntityValue,
} from '../components/molecules/EntityList';
import { PortfolioListing } from '../components/organisms/PortfolioListing';
import classes from './ContactsPage.module.scss';
import { useI18n } from '../i18n';
import {
  formatRelationshipDate,
  normalizeRelationshipKey,
  relationshipErrorStatus,
  relationshipCopy,
} from '../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../features/relationships/auth';

type View = 'all' | 'recruiters' | 'linked' | 'unlinked';
export const ContactsPage = () => {
  const { locale } = useI18n();
  const copy = relationshipCopy(locale);
  const c = copy.contacts;
  const views: ReadonlyArray<readonly [View, string]> = [
    ['all', c.all],
    ['recruiters', c.recruiters],
    ['linked', c.linked],
    ['unlinked', c.unlinked],
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const listing = useListingController('/app/contacts', { view: 'all' });
  const view = listing.value('view') as View;
  const result = usePaginatedListing(
    relationshipKeys.contactPortfolio({
      page: listing.page,
      q: listing.query,
      view,
    }),
    () =>
      relationshipApi.contactPortfolio({
        page: listing.page,
        per_page: 15,
        q: listing.query || undefined,
        view,
      }),
  );
  const data = result.data;
  useRelationshipAuthRedirect(result.error);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    document.title = c.pageTitle;
  }, [c.pageTitle]);
  useEffect(() => {
    const restoreScrollY = (
      location.state as { restoreScrollY?: number } | null
    )?.restoreScrollY;
    if (typeof restoreScrollY === 'number')
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: restoreScrollY }),
      );
  }, [location.state]);

  return (
    <main className={classes.page}>
      {creating && (
        <ContactCreateModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void result.refetch();
          }}
        />
      )}
      <PageHeader
        variant="saas"
        kicker={c.kicker}
        title={c.title}
        description={c.description}
        actions={
          <ActionButton variant="primary" onClick={() => setCreating(true)}>
            {c.add}
          </ActionButton>
        }
      />
      <FilterBar label={c.filters} columns="1fr 260px">
        <SearchField
          label={c.search}
          value={listing.search}
          onChange={(event) => listing.setSearch(event.target.value)}
          placeholder={c.searchPlaceholder}
        />
        <SelectField
          label={c.view}
          value={view}
          onChange={(event) => listing.update('view', event.target.value)}
          options={views}
        />
      </FilterBar>
      <PortfolioListing
        label={c.title}
        headings={[c.title, c.organization, c.details, c.lastActivity]}
        data={data}
        loading={result.isLoading}
        fetching={result.isFetching}
        error={result.isError && relationshipErrorStatus(result.error) !== 401}
        summary={`${data?.total ?? 0} ${data?.total === 1 ? c.singular : c.plural}`}
        summaryAction={
          listing.query || view !== 'all' ? (
            <ActionButton variant="quiet" onClick={listing.clear}>
              {c.clear}
            </ActionButton>
          ) : undefined
        }
        loadingLabel={c.loading}
        errorTitle={c.error}
        emptyTitle={c.empty}
        emptyDescription={c.emptyDescription}
        emptyAction={
          <ActionButton variant="primary" onClick={() => setCreating(true)}>
            {c.add}
          </ActionButton>
        }
        getKey={(contact) => contact.id}
        onOpen={(contact) =>
          navigate(`/app/contacts/${contact.id}`, {
            state: {
              from: `${location.pathname}${location.search}`,
              scrollY: window.scrollY,
            },
          })
        }
        renderCells={(contact) => (
          <>
            <EntityIdentity
              title={`${contact.first_name} ${contact.last_name}`}
              detail={`${contact.role || c.noRole}${contact.is_recruiter ? ` · ${copy.common.recruiter}` : ''}`}
            />
            <EntityValue
              value={contact.organization?.name || c.noOrganization}
              detail={
                contact.organization
                  ? (copy.types[
                      normalizeRelationshipKey(
                        contact.organization.type,
                      ) as keyof typeof copy.types
                    ] ?? contact.organization.type)
                  : '—'
              }
            />
            <EntityValue
              value={contact.email || c.noEmail}
              detail={contact.phone || c.noPhone}
            />
            <EntityValue
              value={formatRelationshipDate(
                contact.updated_at,
                locale,
                copy.common.missing,
              )}
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
