import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { organizationService } from '../services/api';
import { useListingController, usePaginatedListing } from '../hooks/useListingController';
import classes from './OrganizationsPage.module.css';
import { SearchField, SelectField } from '../components/atoms/FormField';
import { ActionButton, ActionLink } from '../components/atoms/Action';
import { EntityIdentity, EntityValue } from '../components/molecules/EntityList';
import { PageHeader } from '../components/molecules/PageHeader';
import { FilterBar } from '../components/molecules/FilterBar';
import { PortfolioListing } from '../components/organisms/PortfolioListing';

const TYPE_LABELS: Record<string, string> = {
  client_final: 'Client final', esn: 'ESN', cabinet_recrutement: 'Cabinet', startup: 'Startup',
  pme: 'PME', grand_compte: 'Grand compte', portage: 'Portage', autre: 'Autre', independant: 'Indépendant',
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export const OrganizationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const listing = useListingController('/app/etablissements', { sort: 'recent' });
  const role = listing.value('role');
  const sort = listing.value('sort');
  const result = usePaginatedListing(
    ['organization-portfolio', { page: listing.page, q: listing.query, role, sort }],
    () => organizationService.getPortfolio({ page: listing.page, per_page: 15, q: listing.query || undefined, relationship_role: role || undefined, sort }),
  );
  const data = result.data;
  useEffect(() => { document.title = 'Entreprises — OfferTrail'; }, []);
  useEffect(() => { const scrollY=(location.state as {restoreScrollY?:number}|null)?.restoreScrollY;if(typeof scrollY==='number')window.requestAnimationFrame(()=>window.scrollTo({top:scrollY})); }, [location.state]);

  return <main className={classes.page}>
    <PageHeader variant="saas" kicker="Portefeuille relationnel" title="Entreprises" description="Chaque fiche rassemble vos candidatures, contacts et échanges avec une même organisation." actions={<ActionLink to="/app/etablissements/maintenance">Nettoyer les doublons</ActionLink>} />
    <FilterBar label="Recherche et tri" columns="minmax(260px,1fr) 190px 220px">
      <SearchField className={classes.search} label="Rechercher une entreprise" value={listing.search} onChange={(event) => listing.setSearch(event.target.value)} placeholder="Nom de l’entreprise…" />
      <SelectField label="Rôle dans le suivi" value={role} onChange={(event) => listing.update('role', event.target.value)} options={[["", "Tous les rôles"], ["intermediary", "Recruteur / intermédiaire"], ["client_final", "Client final"]]} />
      <SelectField label="Trier par" value={sort} onChange={(event) => listing.update('sort', event.target.value)} options={[["recent", "Activité récente"], ["applications", "Nombre de candidatures"], ["name", "Nom A–Z"]]} />
    </FilterBar>

    <PortfolioListing
      label="Entreprises suivies" headings={['Entreprise','Relation','Réponses','Dernière activité']}
      data={data} loading={result.isLoading} fetching={result.isFetching} error={result.isError}
      summary={<><strong>{data?.total ?? '—'}</strong> entreprise{data?.total === 1 ? '' : 's'} dans votre suivi</>}
      summaryAction={(listing.query || role || sort !== 'recent') ? <ActionButton variant="quiet" onClick={listing.clear}>Réinitialiser</ActionButton> : undefined}
      loadingLabel="Chargement du portefeuille…" errorTitle="Impossible de charger les entreprises"
      emptyTitle={listing.query || role ? 'Aucun résultat' : 'Aucune entreprise suivie'}
      emptyDescription={listing.query || role ? 'Essayez avec un autre nom ou retirez les filtres.' : 'Une entreprise apparaîtra ici dès qu’une candidature lui sera reliée.'}
      getKey={(organization) => organization.id} onOpen={(organization) => navigate(`/app/etablissements/${organization.id}`, { state: { from: `${location.pathname}${location.search}`, scrollY: window.scrollY } })}
      renderCells={(organization) => <>
          <EntityIdentity title={organization.name} detail={TYPE_LABELS[organization.type] ?? organization.type} />
          <EntityValue value={organization.applications_count} detail={`candidature${organization.applications_count > 1 ? 's' : ''}`} />
          <EntityValue value={`${organization.response_rate}%`} detail={`${organization.responses_count} retour${organization.responses_count > 1 ? 's' : ''}`} />
          <EntityValue value={<time dateTime={organization.updated_at}>{formatDate(organization.updated_at)}</time>} />
      </>}
      onRetry={() => void result.refetch()} getPageHref={listing.pageHref} onPageChange={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    />
  </main>;
};
