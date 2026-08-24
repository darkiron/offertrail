import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { contactService } from '../services/api/contacts';
import { useListingController, usePaginatedListing } from '../hooks/useListingController';
import ContactCreateModal from '../components/organisms/ContactCreateModal';
import { ActionButton } from '../components/atoms/Action';
import { SearchField, SelectField } from '../components/atoms/FormField';
import { PageHeader } from '../components/molecules/PageHeader';
import { FilterBar } from '../components/molecules/FilterBar';
import { EntityIdentity, EntityValue } from '../components/molecules/EntityList';
import { PortfolioListing } from '../components/organisms/PortfolioListing';
import classes from './ContactsPage.module.css';

type View = 'all' | 'recruiters' | 'linked' | 'unlinked';
const VIEWS: ReadonlyArray<readonly [View, string]> = [['all', 'Tous les contacts'], ['recruiters', 'Recruteurs'], ['linked', 'Liés à une entreprise'], ['unlinked', 'Sans entreprise']];

export const ContactsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const listing = useListingController('/app/contacts', { view: 'all' });
  const view = listing.value('view') as View;
  const result = usePaginatedListing(
    ['contact-portfolio', { page: listing.page, q: listing.query, view }],
    () => contactService.getPortfolio({ page: listing.page, per_page: 15, q: listing.query || undefined, view }),
  );
  const data = result.data;
  const [creating, setCreating] = useState(false);
  useEffect(() => { document.title = 'Contacts — OfferTrail'; }, []);
  useEffect(() => {
    const restoreScrollY = (location.state as { restoreScrollY?: number } | null)?.restoreScrollY;
    if (typeof restoreScrollY === 'number') window.requestAnimationFrame(() => window.scrollTo({ top: restoreScrollY }));
  }, [location.state]);

  return <main className={classes.page}>
    {creating && <ContactCreateModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); void result.refetch(); }} />}
    <PageHeader variant="saas" kicker="Réseau professionnel" title="Contacts" description="Retrouvez les interlocuteurs liés à vos candidatures et le contexte de chaque relation." actions={<ActionButton variant="primary" onClick={() => setCreating(true)}>Ajouter un contact</ActionButton>} />
    <FilterBar label="Filtres des contacts" columns="1fr 260px"><SearchField label="Rechercher" value={listing.search} onChange={(event) => listing.setSearch(event.target.value)} placeholder="Nom, rôle, entreprise…" /><SelectField label="Vue" value={view} onChange={(event) => listing.update('view',event.target.value)} options={VIEWS} /></FilterBar>
    <PortfolioListing
      label="Contacts" headings={['Contact','Entreprise','Coordonnées','Dernière activité']}
      data={data} loading={result.isLoading} fetching={result.isFetching} error={result.isError}
      summary={`${data?.total ?? 0} contact${data?.total === 1 ? '' : 's'}`}
      summaryAction={(listing.query || view !== 'all') ? <ActionButton variant="quiet" onClick={listing.clear}>Effacer les filtres</ActionButton> : undefined}
      loadingLabel="Chargement des contacts…" errorTitle="Impossible de charger les contacts"
      emptyTitle="Aucun contact pour cette vue" emptyDescription="Modifiez les filtres ou ajoutez un nouvel interlocuteur."
      emptyAction={<ActionButton variant="primary" onClick={() => setCreating(true)}>Ajouter un contact</ActionButton>}
      getKey={(contact) => contact.id} onOpen={(contact) => navigate(`/app/contacts/${contact.id}`, { state: { from: `${location.pathname}${location.search}`, scrollY: window.scrollY } })}
      renderCells={(contact) => <><EntityIdentity title={`${contact.first_name} ${contact.last_name}`} detail={`${contact.role || 'Fonction non renseignée'}${contact.is_recruiter ? ' · Recruteur' : ''}`} /><EntityValue value={contact.organization?.name || 'Non rattaché'} detail={contact.organization?.type.replaceAll('_',' ') || '—'} /><EntityValue value={contact.email || 'Email non renseigné'} detail={contact.phone || 'Téléphone non renseigné'} /><EntityValue value={new Date(contact.updated_at).toLocaleDateString('fr-FR')} /></>}
      onRetry={() => void result.refetch()} getPageHref={listing.pageHref} onPageChange={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    />
  </main>;
};
