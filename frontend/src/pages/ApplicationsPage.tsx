import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkflowApplications } from '../hooks/useApplications';
import { useListingController } from '../hooks/useListingController';
import { NewApplicationModal } from '../components/organisms/NewApplicationModal';
import classes from './ApplicationsPage.module.css';
import { SearchField, SelectField } from '../components/atoms/FormField';
import { ActionButton } from '../components/atoms/Action';
import { EntityIdentity, EntityValue } from '../components/molecules/EntityList';
import { SaasPageHeader } from '../components/molecules/SaasPageHeader';
import { FilterBar } from '../components/molecules/FilterBar';
import { PortfolioListing } from '../components/organisms/PortfolioListing';

const STATUS_OPTIONS = [
  ['', 'Tous les statuts'], ['en_attente', 'À préparer'], ['envoyee', 'Envoyée'],
  ['entretien', 'Entretien'], ['offre_recue', 'Offre reçue'], ['refusee', 'Refusée'],
];
const DUE_OPTIONS = [['', 'Toutes les échéances'], ['overdue', 'En retard'], ['today', "Aujourd’hui"], ['week', 'Cette semaine'], ['none', 'Sans prochaine action']];
const SORT_OPTIONS = [['created_at', 'Ajoutées récemment'], ['priority', 'Priorité des actions'], ['applied_at', 'Date de candidature'], ['updated_at', 'Activité récente']];

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function actionLabel(action: { due_at: string; urgency: string } | null) {
  if (!action) return 'Rien de planifié';
  if (action.urgency === 'overdue') return `En retard · ${formatDate(action.due_at)}`;
  if (action.urgency === 'today') return "Aujourd’hui";
  return formatDate(action.due_at);
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find(([value]) => value === status)?.[1] ?? status.replaceAll('_', ' ');
}

export function ApplicationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const listing = useListingController('/app/candidatures', { sort: 'created_at' });
  const [showCreate, setShowCreate] = useState(false);
  const resultsTitle = useRef<HTMLDivElement>(null);
  const status = listing.value('status');
  const due = listing.value('due');
  const sort = listing.value('sort');
  const includeClosed = listing.value('closed') === '1';

  const params = useMemo(() => ({ q: listing.query || undefined, status: status || undefined, due: due || undefined, sort, page: listing.page, per_page: 15, include_closed: includeClosed || status === 'refusee' }), [listing.query, listing.page, status, due, sort, includeClosed]);
  const query = useWorkflowApplications(params);
  const data = query.data;
  const hasFilters = Boolean(params.q || status || due || includeClosed);

  useEffect(() => { document.title = 'Candidatures — OfferTrail'; }, []);
  useEffect(() => {
    const restoreScrollY = (location.state as { restoreScrollY?: number } | null)?.restoreScrollY;
    if (typeof restoreScrollY === 'number') window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollY }));
  }, [location.state]);
  const clearFilters = listing.clear;
  const openRow = (id: string) => navigate(`/app/candidatures/${id}`, { state: { from: `${location.pathname}${location.search}`, scrollY: window.scrollY } });

  if (query.error && (query.error as { response?: { status?: number } }).response?.status === 401) {
    navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    return null;
  }

  return (
    <main className={classes.page} aria-busy={query.isFetching}>
      {showCreate && <NewApplicationModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void query.refetch(); }} />}
      <SaasPageHeader eyebrow="Portefeuille actif" title="Candidatures" description="Retrouvez chaque opportunité et la prochaine décision à prendre." actions={<ActionButton variant="primary" onClick={() => setShowCreate(true)}>Ajouter une candidature</ActionButton>} />
      <FilterBar label="Filtres des candidatures" columns="minmax(220px,1.5fr) repeat(3,minmax(140px,.65fr))">
        <SearchField className={classes.search} label="Rechercher" value={listing.search} onChange={(event) => listing.setSearch(event.target.value)} placeholder="Poste ou entreprise…" />
        <SelectField label="Statut" value={status} onChange={(event) => listing.update('status', event.target.value)} options={STATUS_OPTIONS} />
        <SelectField label="Échéance" value={due} onChange={(event) => listing.update('due', event.target.value)} options={DUE_OPTIONS} />
        <SelectField label="Trier par" value={sort} onChange={(event) => listing.update('sort', event.target.value)} options={SORT_OPTIONS} />
        <label className={classes.closed}><input type="checkbox" checked={includeClosed} onChange={(event) => listing.update('closed', event.target.checked ? '1' : '')} /> Inclure les candidatures refusées</label>
      </FilterBar>

      <div ref={resultsTitle} tabIndex={-1}><PortfolioListing
        label="Candidatures" headings={['Poste / entreprise','Statut','Prochaine action','Dernier signal']}
        data={data} loading={query.isLoading} fetching={query.isFetching} error={query.isError}
        summary={`${data?.total ?? 0} candidature${data?.total === 1 ? '' : 's'}`}
        summaryAction={hasFilters ? <ActionButton variant="quiet" onClick={clearFilters}>Effacer les filtres</ActionButton> : undefined}
        loadingLabel="Chargement des candidatures…" errorTitle="La liste ne répond pas"
        emptyTitle={hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucune candidature pour le moment'}
        emptyDescription={hasFilters ? 'Modifiez ou effacez les critères actifs.' : 'Ajoutez la première pour centraliser son contexte et planifier la suite.'}
        emptyAction={hasFilters ? <ActionButton onClick={clearFilters}>Effacer les filtres</ActionButton> : <ActionButton variant="primary" onClick={() => setShowCreate(true)}>Ajouter une candidature</ActionButton>}
        getKey={(item) => item.id} onOpen={(item) => openRow(item.id)}
        renderCells={(item) => <>
              <EntityIdentity title={item.poste} detail={item.organization.name} />
              <EntityValue value={statusLabel(item.statut)} />
              <EntityValue value={actionLabel(item.next_action)} tone={item.next_action?.urgency === 'overdue' ? 'danger' : 'default'} />
              <EntityValue value={item.last_event ? statusLabel(item.last_event.kind) : 'Aucune activité'} detail={item.last_event ? formatDate(item.last_event.occurred_at) : undefined} tone={item.last_event ? 'default' : 'muted'} />
        </>}
        onRetry={() => void query.refetch()} getPageHref={listing.pageHref} onPageChange={() => window.requestAnimationFrame(() => resultsTitle.current?.focus())}
      /></div>
    </main>
  );
}

export default ApplicationsPage;
