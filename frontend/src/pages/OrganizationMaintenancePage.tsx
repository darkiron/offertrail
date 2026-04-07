import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { organizationService } from '../services/api';
import { Spinner } from '../components/atoms/Spinner';
import { Title } from '../components/atoms/Title';
import type { Organization } from '../types';

type MaintenanceTab = 'merge' | 'split';

const pageStyles = `
  .org-maint-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 30px 32px 40px;
    color: var(--text-main);
  }

  .org-maint-backLink {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 700;
  }

  .org-maint-hero,
  .org-maint-panel,
  .org-maint-statCard,
  .org-maint-summaryCard,
  .org-maint-tipCard {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 22px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 90%, white 10%), var(--bg-mantle));
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.12);
  }

  .org-maint-hero {
    padding: 30px;
    display: grid;
    grid-template-columns: minmax(0, 1.75fr) minmax(300px, 0.95fr);
    gap: 22px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 70%, var(--bg-mantle) 30%));
  }

  .org-maint-eyebrow,
  .org-maint-cardLabel,
  .org-maint-sectionLabel,
  .org-maint-inputLabel {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .org-maint-lead {
    max-width: 720px;
    margin: 16px 0 0;
    color: var(--text-dim);
    line-height: 1.65;
    font-size: 15px;
  }

  .org-maint-badges,
  .org-maint-tabRow,
  .org-maint-toolbar,
  .org-maint-cardMeta,
  .org-maint-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .org-maint-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bg-base) 74%, var(--bg-mantle) 26%);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 700;
  }

  .org-maint-heroRail {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .org-maint-statCard {
    padding: 18px;
  }

  .org-maint-statValue {
    margin-top: 10px;
    font-size: 30px;
    line-height: 1;
    font-weight: 800;
  }

  .org-maint-statHint {
    margin-top: 8px;
    color: var(--text-dim);
    font-size: 13px;
  }

  .org-maint-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.9fr);
    gap: 20px;
    align-items: start;
  }

  .org-maint-panel {
    padding: 22px;
  }

  .org-maint-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 15px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    background: transparent;
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 700;
  }

  .org-maint-tab.is-active {
    color: var(--text-main);
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  }

  .org-maint-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 18px;
  }

  .org-maint-field,
  .org-maint-summaryCard,
  .org-maint-tipCard {
    padding: 18px;
  }

  .org-maint-field {
    border-radius: 18px;
    background: color-mix(in srgb, var(--bg-base) 78%, var(--bg-mantle) 22%);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .org-maint-input,
  .org-maint-textarea {
    width: 100%;
    margin-top: 10px;
    padding: 13px 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    background: color-mix(in srgb, var(--bg-base) 86%, var(--bg-mantle) 14%);
    color: var(--text-main);
    outline: none;
  }

  .org-maint-textarea {
    min-height: 96px;
    resize: vertical;
  }

  .org-maint-input:focus,
  .org-maint-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  }

  .org-maint-formGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .org-maint-formGrid .is-full {
    grid-column: 1 / -1;
  }

  .org-maint-summaryCard,
  .org-maint-tipCard {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .org-maint-cardTitle {
    margin: 0;
    font-size: 18px;
    line-height: 1.25;
  }

  .org-maint-cardMeta {
    color: var(--text-dim);
    font-size: 13px;
  }

  .org-maint-searchStack,
  .org-maint-proposalList {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .org-maint-searchResults {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 320px;
    overflow-y: auto;
    margin-top: 4px;
  }

  .org-maint-searchItem {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    text-align: left;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-base) 82%, var(--bg-mantle) 18%);
    color: var(--text-main);
  }

  .org-maint-searchItem.is-selected {
    border-color: color-mix(in srgb, var(--accent) 46%, transparent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-base) 88%);
  }

  .org-maint-searchName {
    font-size: 14px;
    font-weight: 700;
  }

  .org-maint-searchMeta {
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-dim);
  }

  .org-maint-proposalList {
    margin-top: 14px;
  }

  .org-maint-proposalItem {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-base) 82%, var(--bg-mantle) 18%);
  }

  .org-maint-proposalName {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
  }

  .org-maint-proposalMeta {
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-dim);
  }

  .org-maint-miniBtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-base) 78%, var(--bg-mantle) 22%);
    color: var(--text-main);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .org-maint-empty,
  .org-maint-error {
    padding: 48px 20px;
    text-align: center;
  }

  .org-maint-error {
    border: 1px solid rgba(244, 63, 94, 0.3);
    border-radius: 18px;
    background: rgba(244, 63, 94, 0.08);
    color: #fb7185;
  }

  .org-maint-actionBtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    border: 1px solid transparent;
    padding: 11px 16px;
    font-size: 14px;
    font-weight: 700;
    transition: transform 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
  }

  .org-maint-actionBtn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .org-maint-actionBtn:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .org-maint-actionBtn.is-primary {
    color: white;
    background: linear-gradient(135deg, #2563eb, #38bdf8);
  }

  .org-maint-actionBtn.is-ghost {
    color: var(--text-main);
    border-color: color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-base) 80%, var(--bg-mantle) 20%);
  }

  @media (max-width: 1120px) {
    .org-maint-hero,
    .org-maint-layout,
    .org-maint-grid,
    .org-maint-formGrid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .org-maint-shell {
      padding: 18px;
      gap: 18px;
    }

    .org-maint-heroRail {
      grid-template-columns: 1fr;
    }
  }
`;

const organizationTypeOptions: Array<{ value: Organization['type']; label: string }> = [
  { value: 'CLIENT_FINAL', label: 'Client final' },
  { value: 'ESN', label: 'ESN' },
  { value: 'CABINET_RECRUTEMENT', label: 'Cabinet' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'PME', label: 'PME' },
  { value: 'GRAND_COMPTE', label: 'Grand compte' },
  { value: 'PORTAGE', label: 'Portage' },
  { value: 'AUTRE', label: 'Autre' },
];

const tabDefinitions: Array<{ id: MaintenanceTab; label: string; icon: 'merge' | 'split'; hint: string }> = [
  { id: 'merge', label: 'Fusion', icon: 'merge', hint: 'Rattache un ETS au bon enregistrement et supprime le doublon.' },
  { id: 'split', label: 'Scission', icon: 'split', hint: 'Cree un nouvel ETS a partir d un enregistrement composite.' },
];

const ToolIcon: React.FC<{ kind: 'merge' | 'split' | 'maintenance' | 'link'; size?: number }> = ({ kind, size = 16 }) => {
  if (kind === 'merge') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h5a4 4 0 0 1 4 4v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m13 15 3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 7h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'split') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 12h5a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 12H7a3 3 0 0 0-3 3v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'link') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 14 14 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 8.5 7 10a3 3 0 0 0 4.243 4.243L13 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.5 15.5 17 14a3 3 0 1 0-4.243-4.243L11 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.93 4.93l2.83 2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.24 16.24l2.83 2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.93 19.07l2.83-2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
};

const getOrgLabel = (organization?: Organization | null) => {
  if (!organization) {
    return 'Aucun ETS selectionne';
  }

  return organization.city ? `${organization.name} - ${organization.city}` : organization.name;
};

const getSearchEmptyMessage = (query: string, kind: 'source' | 'target') => {
  if (query.trim()) {
    return 'Aucun ETS ne correspond a cette recherche.';
  }

  return kind === 'source'
    ? 'Commence a taper pour choisir l ETS source.'
    : 'Commence a taper pour choisir l ETS cible.';
};

const getOrganizationSearchBlob = (organization: Organization) => {
  return [
    organization.name,
    organization.city || '',
    organization.website || '',
    organization.linkedin_url || '',
    organization.notes || '',
  ].join(' ').toLowerCase();
};

const scoreOrganizationMatch = (reference: Organization, candidate: Organization) => {
  const sourceName = reference.name.toLowerCase();
  const candidateName = candidate.name.toLowerCase();
  let score = 0;

  if (candidateName === sourceName) {
    score += 12;
  }
  if (candidateName.includes(sourceName) || sourceName.includes(candidateName)) {
    score += 8;
  }
  if (reference.city && candidate.city && reference.city.toLowerCase() === candidate.city.toLowerCase()) {
    score += 4;
  }
  if ((reference.website || '') && candidate.website && reference.website === candidate.website) {
    score += 6;
  }
  if ((reference.linkedin_url || '') && candidate.linkedin_url && reference.linkedin_url === candidate.linkedin_url) {
    score += 6;
  }
  if ((reference.total_applications ?? 0) === 0 || (candidate.total_applications ?? 0) === 0) {
    score += 1;
  }

  return score;
};

export const OrganizationMaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceFromQuery = searchParams.get('source') || '';
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MaintenanceTab>('merge');
  const [sourceOrgId, setSourceOrgId] = useState(sourceFromQuery);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [splitForm, setSplitForm] = useState({
    name: '',
    type: 'AUTRE' as Organization['type'],
    city: '',
    website: '',
    linkedin_url: '',
    notes: '',
  });

  useEffect(() => { document.title = 'Maintenance entreprises — OfferTrail'; }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await organizationService.getAll();
        setOrganizations(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setError('Impossible de charger les ETS pour la maintenance.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (sourceFromQuery) {
      setSourceOrgId(sourceFromQuery);
    }
  }, [sourceFromQuery]);

  useEffect(() => {
    if (sourceOrgId === targetOrgId) {
      setTargetOrgId('');
    }
  }, [sourceOrgId, targetOrgId]);

  const sourceOrganization = useMemo(
    () => organizations.find((organization) => String(organization.id) === sourceOrgId) ?? null,
    [organizations, sourceOrgId],
  );

  const targetOptions = useMemo(
    () => organizations.filter((organization) => String(organization.id) !== sourceOrgId),
    [organizations, sourceOrgId],
  );

  const targetOrganization = useMemo(
    () => organizations.find((organization) => String(organization.id) === targetOrgId) ?? null,
    [organizations, targetOrgId],
  );

  const sourceSearchResults = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase();
    const list = query
      ? organizations.filter((organization) => getOrganizationSearchBlob(organization).includes(query))
      : [];

    return list.slice(0, 8);
  }, [organizations, sourceSearch]);

  const targetSearchResults = useMemo(() => {
    const query = targetSearch.trim().toLowerCase();
    const list = query
      ? targetOptions.filter((organization) => getOrganizationSearchBlob(organization).includes(query))
      : [];

    return list.slice(0, 8);
  }, [targetOptions, targetSearch]);

  const targetProposals = useMemo(() => {
    if (!sourceOrganization) {
      return [];
    }

    return targetOptions
      .map((organization) => ({
        organization,
        score: scoreOrganizationMatch(sourceOrganization, organization),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.organization.name.localeCompare(b.organization.name))
      .slice(0, 5);
  }, [sourceOrganization, targetOptions]);

  const sourceProposals = useMemo(() => {
    if (!targetOrganization) {
      return [];
    }

    return organizations
      .filter((organization) => organization.id !== targetOrganization.id)
      .map((organization) => ({
        organization,
        score: scoreOrganizationMatch(targetOrganization, organization),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.organization.name.localeCompare(b.organization.name))
      .slice(0, 5);
  }, [organizations, targetOrganization]);

  useEffect(() => {
    if (sourceOrganization && !sourceSearch) {
      setSourceSearch(getOrgLabel(sourceOrganization));
    }
  }, [sourceOrganization, sourceSearch]);

  useEffect(() => {
    if (targetOrganization && !targetSearch) {
      setTargetSearch(getOrgLabel(targetOrganization));
    }
  }, [targetOrganization, targetSearch]);

  const resetSplitForm = () => {
    setSplitForm({
      name: '',
      type: 'AUTRE',
      city: '',
      website: '',
      linkedin_url: '',
      notes: '',
    });
  };

  const handleMerge = async () => {
    if (!sourceOrgId || !targetOrgId) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await organizationService.merge(Number(sourceOrgId), Number(targetOrgId));
      navigate(`/organizations/${targetOrgId}`);
    } catch {
      setError('La fusion a echoue. Verifie les ETS selectionnes puis recommence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSplit = async () => {
    if (!sourceOrgId || !splitForm.name.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await organizationService.split(Number(sourceOrgId), {
        ...splitForm,
        move_contacts: true,
      });
      resetSplitForm();
      navigate(`/organizations/${created.id}`);
    } catch {
      setError('La scission a echoue. Complete le nouvel ETS puis recommence.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalApplications = organizations.reduce((sum, organization) => sum + (organization.total_applications ?? 0), 0);
  const compositeOrganizations = organizations.filter((organization) => organization.name.includes(' - ') || organization.name.includes('/')).length;

  if (loading) {
    return (
      <div className="org-maint-shell">
        <style>{pageStyles}</style>
        <div className="org-maint-panel org-maint-empty">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="org-maint-shell">
      <style>{pageStyles}</style>

      <Link to="/organizations" className="org-maint-backLink">
        Retour aux etablissements
      </Link>

      <section className="org-maint-hero">
        <div>
          <span className="org-maint-eyebrow">Maintenance ETS</span>
          <Title>Fusionner ou scinder les etablissements</Title>
          <p className="org-maint-lead">
            Utilise cet espace quand une fiche doit etre rattachee a la bonne entreprise ou decoupee en un nouvel ETS.
            La maintenance est sortie des fiches detail pour garder un flux plus propre et plus securise.
          </p>
          <div className="org-maint-badges" style={{ marginTop: 18 }}>
            <span className="org-maint-badge"><ToolIcon kind="maintenance" /> Outil dedie</span>
            <span className="org-maint-badge"><ToolIcon kind="merge" /> Fusion des doublons</span>
            <span className="org-maint-badge"><ToolIcon kind="split" /> Creation d un ETS separe</span>
          </div>
        </div>

        <div className="org-maint-heroRail">
          <div className="org-maint-statCard">
            <span className="org-maint-cardLabel">Portefeuille</span>
            <div className="org-maint-statValue">{organizations.length}</div>
            <div className="org-maint-statHint">ETS disponibles pour maintenance</div>
          </div>
          <div className="org-maint-statCard">
            <span className="org-maint-cardLabel">Volume associe</span>
            <div className="org-maint-statValue">{totalApplications}</div>
            <div className="org-maint-statHint">candidatures potentiellement deplacees</div>
          </div>
          <div className="org-maint-statCard">
            <span className="org-maint-cardLabel">Composites reperes</span>
            <div className="org-maint-statValue">{compositeOrganizations}</div>
            <div className="org-maint-statHint">noms contenant des signaux de scission</div>
          </div>
          <div className="org-maint-statCard">
            <span className="org-maint-cardLabel">Source active</span>
            <div className="org-maint-statValue" style={{ fontSize: 18, lineHeight: 1.2 }}>{sourceOrganization ? sourceOrganization.name : 'Aucune'}</div>
            <div className="org-maint-statHint">selection courante</div>
          </div>
        </div>
      </section>

      {error ? <div className="org-maint-error">{error}</div> : null}

      <section className="org-maint-layout">
        <div className="org-maint-panel">
          <div className="org-maint-toolbar">
            <div>
              <span className="org-maint-sectionLabel">Mode</span>
              <div className="org-maint-tabRow" style={{ marginTop: 10 }}>
                {tabDefinitions.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`org-maint-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <ToolIcon kind={tab.icon} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>{tabDefinitions.find((tab) => tab.id === activeTab)?.hint}</div>
          </div>

          <div className="org-maint-grid">
            <div className="org-maint-field">
              <label className="org-maint-inputLabel" htmlFor="source-organization">ETS source</label>
              <div className="org-maint-searchStack">
                <input
                  id="source-organization"
                  className="org-maint-input"
                  value={sourceSearch}
                  onChange={(event) => setSourceSearch(event.target.value)}
                  placeholder="Recherche source: nom, ville, site..."
                />
                <div className="org-maint-searchResults">
                  {sourceSearchResults.length > 0 ? sourceSearchResults.map((organization) => (
                    <button
                      key={organization.id}
                      type="button"
                      className={`org-maint-searchItem ${sourceOrgId === String(organization.id) ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSourceOrgId(String(organization.id));
                        setSourceSearch(getOrgLabel(organization));
                      }}
                    >
                      <div>
                        <div className="org-maint-searchName">{organization.name}</div>
                        <div className="org-maint-searchMeta">
                          {organization.city || 'Ville non renseignee'} · {organization.total_applications ?? 0} candidature(s)
                        </div>
                      </div>
                      <span className="org-maint-miniBtn">Choisir</span>
                    </button>
                  )) : (
                    <div className="org-maint-searchMeta">{getSearchEmptyMessage(sourceSearch, 'source')}</div>
                  )}
                </div>
              </div>
            </div>

            {activeTab === 'merge' ? (
              <div className="org-maint-field">
                <label className="org-maint-inputLabel" htmlFor="target-organization">ETS cible</label>
                <div className="org-maint-searchStack">
                  <input
                    id="target-organization"
                    className="org-maint-input"
                    value={targetSearch}
                    onChange={(event) => setTargetSearch(event.target.value)}
                    placeholder="Recherche cible: nom, ville, site..."
                  />
                  <div className="org-maint-searchResults">
                    {targetSearchResults.length > 0 ? targetSearchResults.map((organization) => (
                      <button
                        key={organization.id}
                        type="button"
                        className={`org-maint-searchItem ${targetOrgId === String(organization.id) ? 'is-selected' : ''}`}
                        onClick={() => {
                          setTargetOrgId(String(organization.id));
                          setTargetSearch(getOrgLabel(organization));
                        }}
                      >
                        <div>
                          <div className="org-maint-searchName">{organization.name}</div>
                          <div className="org-maint-searchMeta">
                            {organization.city || 'Ville non renseignee'} · {organization.total_applications ?? 0} candidature(s)
                          </div>
                        </div>
                        <span className="org-maint-miniBtn">Choisir</span>
                      </button>
                    )) : (
                      <div className="org-maint-searchMeta">{getSearchEmptyMessage(targetSearch, 'target')}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {activeTab === 'merge' ? (
            <>
              <div className="org-maint-grid">
                <div className="org-maint-summaryCard">
                  <span className="org-maint-cardLabel">Source a supprimer</span>
                  <h3 className="org-maint-cardTitle">{getOrgLabel(sourceOrganization)}</h3>
                  {sourceOrganization ? (
                    <div className="org-maint-cardMeta">
                      <span>{sourceOrganization.total_applications ?? 0} candidature(s)</span>
                      <span>{sourceOrganization.response_rate ?? 0}% de reponse</span>
                    </div>
                  ) : <div className="org-maint-cardMeta">Selectionne d abord l ETS a absorber.</div>}
                </div>

                <div className="org-maint-summaryCard">
                  <span className="org-maint-cardLabel">Cible finale</span>
                  <h3 className="org-maint-cardTitle">{getOrgLabel(targetOrganization)}</h3>
                  {targetOrganization ? (
                    <div className="org-maint-cardMeta">
                      <span>{targetOrganization.total_applications ?? 0} candidature(s)</span>
                      <span>{targetOrganization.city || 'Ville non renseignee'}</span>
                    </div>
                  ) : <div className="org-maint-cardMeta">Choisis l ETS qui doit conserver l historique.</div>}
                </div>
              </div>

              <div className="org-maint-grid" style={{ marginTop: 18 }}>
                <div className="org-maint-tipCard">
                  <span className="org-maint-cardLabel">Propositions depuis la source</span>
                  {targetProposals.length > 0 ? (
                    <div className="org-maint-proposalList">
                      {targetProposals.map(({ organization, score }) => (
                        <div key={organization.id} className="org-maint-proposalItem">
                          <div>
                            <div className="org-maint-proposalName">{organization.name}</div>
                            <div className="org-maint-proposalMeta">
                              {organization.city || 'Ville non renseignee'} · {organization.total_applications ?? 0} candidature(s) · score {score}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="org-maint-miniBtn"
                            onClick={() => {
                              setTargetOrgId(String(organization.id));
                              setTargetSearch(getOrgLabel(organization));
                            }}
                          >
                            Choisir
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                      Selectionne une source pour voir les cibles probables.
                    </div>
                  )}
                </div>

                <div className="org-maint-tipCard">
                  <span className="org-maint-cardLabel">Propositions depuis la cible</span>
                  {sourceProposals.length > 0 ? (
                    <div className="org-maint-proposalList">
                      {sourceProposals.map(({ organization, score }) => (
                        <div key={organization.id} className="org-maint-proposalItem">
                          <div>
                            <div className="org-maint-proposalName">{organization.name}</div>
                            <div className="org-maint-proposalMeta">
                              {organization.city || 'Ville non renseignee'} · {organization.total_applications ?? 0} candidature(s) · score {score}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="org-maint-miniBtn"
                            onClick={() => {
                              setSourceOrgId(String(organization.id));
                              setSourceSearch(getOrgLabel(organization));
                            }}
                          >
                            Choisir
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                      Choisis une cible pour voir quelles sources proches pourraient y etre fusionnees.
                    </div>
                  )}
                </div>
              </div>

              <div className="org-maint-actions" style={{ marginTop: 22 }}>
                <button
                  type="button"
                  className="org-maint-actionBtn is-primary"
                  disabled={!sourceOrgId || !targetOrgId || submitting}
                  onClick={handleMerge}
                >
                  <ToolIcon kind="merge" />
                  Fusionner maintenant
                </button>
                {sourceOrganization ? (
                  <Link to={`/organizations/${sourceOrganization.id}`} className="org-maint-actionBtn is-ghost">
                    Ouvrir la fiche source
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="org-maint-formGrid">
                <div className="org-maint-field">
                  <label className="org-maint-inputLabel" htmlFor="split-name">Nom du nouvel ETS</label>
                  <input
                    id="split-name"
                    className="org-maint-input"
                    value={splitForm.name}
                    onChange={(event) => setSplitForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ex: Mr Auto"
                  />
                </div>

                <div className="org-maint-field">
                  <label className="org-maint-inputLabel" htmlFor="split-type">Type</label>
                  <select
                    id="split-type"
                    className="org-maint-input"
                    value={splitForm.type}
                    onChange={(event) => setSplitForm((current) => ({ ...current, type: event.target.value as Organization['type'] }))}
                  >
                    {organizationTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="org-maint-field">
                  <label className="org-maint-inputLabel" htmlFor="split-city">Ville</label>
                  <input
                    id="split-city"
                    className="org-maint-input"
                    value={splitForm.city}
                    onChange={(event) => setSplitForm((current) => ({ ...current, city: event.target.value }))}
                    placeholder="Paris"
                  />
                </div>

                <div className="org-maint-field">
                  <label className="org-maint-inputLabel" htmlFor="split-website">Site web</label>
                  <input
                    id="split-website"
                    className="org-maint-input"
                    value={splitForm.website}
                    onChange={(event) => setSplitForm((current) => ({ ...current, website: event.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="org-maint-field">
                  <label className="org-maint-inputLabel" htmlFor="split-linkedin">LinkedIn</label>
                  <input
                    id="split-linkedin"
                    className="org-maint-input"
                    value={splitForm.linkedin_url}
                    onChange={(event) => setSplitForm((current) => ({ ...current, linkedin_url: event.target.value }))}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>

                <div className="org-maint-field is-full">
                  <label className="org-maint-inputLabel" htmlFor="split-notes">Notes</label>
                  <textarea
                    id="split-notes"
                    className="org-maint-textarea"
                    value={splitForm.notes}
                    onChange={(event) => setSplitForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Contexte de la scission et informations utiles."
                  />
                </div>
              </div>

              <div className="org-maint-tipCard" style={{ marginTop: 18 }}>
                <span className="org-maint-cardLabel">Ce que fera la scission</span>
                <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>
                  Le nouvel ETS sera cree puis les candidatures et contacts de la fiche source seront deplaces vers lui.
                  Utilise ce flux pour des cas comme "Hays France - Mr Auto" afin d obtenir un ETS clair et exploitable.
                </div>
              </div>

              <div className="org-maint-actions" style={{ marginTop: 22 }}>
                <button
                  type="button"
                  className="org-maint-actionBtn is-primary"
                  disabled={!sourceOrgId || !splitForm.name.trim() || submitting}
                  onClick={handleSplit}
                >
                  <ToolIcon kind="split" />
                  Creer et scinder
                </button>
                <button
                  type="button"
                  className="org-maint-actionBtn is-ghost"
                  disabled={submitting}
                  onClick={resetSplitForm}
                >
                  Reinitialiser
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="org-maint-panel">
          <span className="org-maint-sectionLabel">Lecture rapide</span>
          <div className="org-maint-tipCard" style={{ marginTop: 16 }}>
            <span className="org-maint-cardLabel">Quand fusionner</span>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>
              Meme entreprise, orthographes proches, ou fiche vide a rattacher a un ETS deja propre.
            </div>
          </div>
          <div className="org-maint-tipCard" style={{ marginTop: 16 }}>
            <span className="org-maint-cardLabel">Quand scinder</span>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>
              Un enregistrement melange un cabinet et son client, ou plusieurs marques distinctes dans le meme nom.
            </div>
          </div>
          <div className="org-maint-tipCard" style={{ marginTop: 16 }}>
            <span className="org-maint-cardLabel">Bon reflexe</span>
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>
              Ouvre d abord la fiche source pour verifier les candidatures rattachees, puis lance la maintenance ici.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default OrganizationMaintenancePage;
