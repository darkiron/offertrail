import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { organizationService } from '../services/api';
import { Title } from '../components/atoms/Title';
import { Spinner } from '../components/atoms/Spinner';
import type { Organization, OrganizationType } from '../types';

type OrganizationTab = 'all' | 'engaged' | 'responsive' | 'watchlist';

const organizationTypeLabels: Record<OrganizationType, string> = {
  CLIENT_FINAL: 'Client final',
  ESN: 'ESN',
  CABINET_RECRUTEMENT: 'Cabinet',
  STARTUP: 'Startup',
  PME: 'PME',
  GRAND_COMPTE: 'Grand compte',
  PORTAGE: 'Portage',
  AUTRE: 'Autre',
};

const tabDefinitions: Array<{ id: OrganizationTab; label: string; hint: string }> = [
  { id: 'all', label: 'Tous', hint: 'Vue complete du portefeuille' },
  { id: 'engaged', label: 'Actifs', hint: 'Organisations avec candidatures' },
  { id: 'responsive', label: 'Repondent', hint: 'Taux de reponse >= 35%' },
  { id: 'watchlist', label: 'A surveiller', hint: 'Activite sans retour significatif' },
];

const organizationTypes: OrganizationType[] = [
  'CLIENT_FINAL',
  'ESN',
  'CABINET_RECRUTEMENT',
  'STARTUP',
  'PME',
  'GRAND_COMPTE',
  'PORTAGE',
  'AUTRE',
];

const pageStyles = `
  .organizations-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 32px;
    color: var(--text-main);
  }

  .organizations-hero {
    display: grid;
    grid-template-columns: minmax(0, 2.1fr) minmax(320px, 1fr);
    gap: 20px;
    align-items: stretch;
  }

  .organizations-heroPanel,
  .organizations-sidebarPanel,
  .organizations-filterPanel,
  .organizations-listPanel,
  .organization-card {
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 86%, white 14%), var(--bg-mantle));
    border: 1px solid color-mix(in srgb, var(--border) 88%, transparent 12%);
    border-radius: 20px;
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.12);
  }

  .organizations-heroPanel {
    padding: 28px;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 36%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 70%, var(--bg-mantle) 30%));
  }

  .organizations-heroPanel::after {
    content: '';
    position: absolute;
    inset: auto -48px -48px auto;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.08);
  }

  .organizations-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 24px;
  }

  .organizations-kpi {
    padding: 16px;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.22);
    border: 1px solid rgba(148, 163, 184, 0.16);
    backdrop-filter: blur(8px);
  }

  .organizations-kpiLabel {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .organizations-kpiValue {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .organizations-kpiHint {
    margin-top: 6px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .organizations-sidebarPanel {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .organizations-sidebarStat {
    padding-bottom: 18px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .organizations-sidebarStat:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .organizations-filterPanel {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .organizations-filterGrid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(220px, 0.8fr);
    gap: 14px;
  }

  .organizations-search,
  .organizations-select {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid color-mix(in srgb, var(--border) 88%, transparent 12%);
    border-radius: 14px;
    background: color-mix(in srgb, var(--bg-base) 84%, var(--bg-mantle) 16%);
    color: var(--text-main);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  .organizations-search:focus,
  .organizations-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
    transform: translateY(-1px);
  }

  .organizations-filterMeta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .organizations-resultsText {
    font-size: 14px;
    color: var(--text-dim);
  }

  .organizations-typePills,
  .organizations-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .organizations-pill,
  .organizations-tab {
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    border-radius: 999px;
    background: transparent;
    color: var(--text-dim);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
  }

  .organizations-pill.is-active,
  .organizations-tab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 44%, transparent);
    color: var(--text-main);
  }

  .organizations-listPanel {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .organizations-listHeader {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
  }

  .organizations-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .organization-card {
    padding: 20px;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .organization-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--accent) 44%, var(--border) 56%);
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.18);
  }

  .organization-cardHeader,
  .organization-cardMeta,
  .organization-cardFooter {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .organization-cardMeta {
    flex-wrap: wrap;
    margin-top: 12px;
    align-items: center;
  }

  .organization-cardTitle {
    margin: 10px 0 0;
    font-size: 22px;
    line-height: 1.15;
  }

  .organization-cardSubtitle,
  .organization-cardHint,
  .organization-note,
  .organization-footerText {
    color: var(--text-dim);
    font-size: 14px;
  }

  .organization-note {
    margin: 14px 0 0;
    min-height: 42px;
  }

  .organization-typeBadge,
  .organization-healthBadge,
  .organization-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .organization-typeBadge {
    background: rgba(59, 130, 246, 0.12);
    color: var(--text-main);
    border: 1px solid rgba(59, 130, 246, 0.22);
  }

  .organization-healthBadge {
    border: 1px solid transparent;
  }

  .organization-healthBadge.is-good {
    background: rgba(34, 197, 94, 0.14);
    color: #4ade80;
    border-color: rgba(34, 197, 94, 0.28);
  }

  .organization-healthBadge.is-mid {
    background: rgba(245, 158, 11, 0.14);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.28);
  }

  .organization-healthBadge.is-low {
    background: rgba(244, 63, 94, 0.14);
    color: #fb7185;
    border-color: rgba(244, 63, 94, 0.28);
  }

  .organization-link {
    color: var(--text-main);
    border: 1px solid color-mix(in srgb, var(--border) 78%, transparent 22%);
    background: color-mix(in srgb, var(--bg-base) 80%, var(--bg-mantle) 20%);
  }

  .organization-link:hover {
    color: var(--text-main);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  }

  .organization-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }

  .organization-stat {
    padding: 14px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg-base) 74%, var(--bg-mantle) 26%);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .organization-statLabel {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .organization-statValue {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
  }

  .organization-progress {
    margin-top: 10px;
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: color-mix(in srgb, var(--bg-crust) 60%, var(--bg-surface) 40%);
  }

  .organization-progressBar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #38bdf8, #3b82f6);
  }

  .organization-cardFooter {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    align-items: center;
  }

  .organization-empty,
  .organizations-errorState {
    padding: 52px 20px;
    text-align: center;
    color: var(--text-dim);
  }

  .organizations-errorState {
    border: 1px solid rgba(244, 63, 94, 0.32);
    border-radius: 18px;
    background: rgba(244, 63, 94, 0.08);
    color: #fb7185;
  }

  .organizations-heroActions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 22px;
  }

  .organizations-actionLink {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 11px 16px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-base) 78%, var(--bg-mantle) 22%);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
  }

  .organizations-actionLink.is-primary {
    color: white;
    border-color: transparent;
    background: linear-gradient(135deg, #2563eb, #38bdf8);
  }

  @media (max-width: 1100px) {
    .organizations-hero,
    .organizations-filterGrid,
    .organizations-grid {
      grid-template-columns: 1fr;
    }

    .organizations-kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .organizations-shell {
      padding: 18px;
      gap: 18px;
    }

    .organizations-kpis,
    .organization-stats {
      grid-template-columns: 1fr;
    }

    .organizations-heroPanel,
    .organizations-sidebarPanel,
    .organizations-filterPanel,
    .organizations-listPanel,
    .organization-card {
      border-radius: 16px;
    }
  }
`;

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<OrganizationTab>('all');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Établissements — OfferTrail';
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getAll({
        type: typeFilter || undefined,
        search: search || undefined,
      });
      setOrganizations(data);
    } catch {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [typeFilter, search]);

  const getPositiveRate = (organization: Organization) => {
    const rawValue = (organization as Organization & { positive_rate?: number | null }).positive_rate;
    return typeof rawValue === 'number' ? rawValue : 0;
  };

  const getRejectionRate = (organization: Organization) => {
    const rawValue = (organization as Organization & { rejection_rate?: number | null }).rejection_rate;
    if (typeof rawValue === 'number') {
      return rawValue;
    }
    return Math.max(0, Math.min(100, Math.round((organization.response_rate || 0) - getPositiveRate(organization))));
  };

  const getHealthBucket = (organization: Organization) => {
    if ((organization.response_rate || 0) >= 45) {
      return { tone: 'is-good', label: 'Dynamique saine' };
    }
    if ((organization.response_rate || 0) >= 20) {
      return { tone: 'is-mid', label: 'A entretenir' };
    }
    return { tone: 'is-low', label: 'Relation froide' };
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const typeCounts = organizationTypes.reduce<Record<string, number>>((accumulator, type) => {
    accumulator[type] = organizations.filter((organization) => organization.type === type).length;
    return accumulator;
  }, {});

  const totalApplications = organizations.reduce((sum, organization) => sum + (organization.total_applications ?? 0), 0);
  const engagedOrganizations = organizations.filter((organization) => (organization.total_applications ?? 0) > 0);
  const watchlistOrganizations = organizations.filter(
    (organization) => (organization.total_applications ?? 0) > 0 && (organization.response_rate ?? 0) < 20,
  );
  const averageResponseRate = organizations.length
    ? Math.round(organizations.reduce((sum, organization) => sum + (organization.response_rate ?? 0), 0) / organizations.length)
    : 0;

  const visibleOrganizations = organizations.filter((organization) => {
    switch (activeTab) {
      case 'engaged':
        return (organization.total_applications ?? 0) > 0;
      case 'responsive':
        return (organization.response_rate ?? 0) >= 35;
      case 'watchlist':
        return (organization.total_applications ?? 0) > 0 && (organization.response_rate ?? 0) < 20;
      default:
        return true;
    }
  });

  const ToolIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

  return (
    <div className="organizations-shell">
      <style>{pageStyles}</style>

      <section className="organizations-hero">
        <div className="organizations-heroPanel">
          <span className="organizations-kpiLabel">Pipeline organisations</span>
          <Title className="mb-md">Etablissements</Title>
          <p style={{ maxWidth: 640, margin: 0, color: 'var(--text-dim)', fontSize: 16, lineHeight: 1.6 }}>
            Une vue plus operationnelle du portefeuille: filtres utiles, onglets pour prioriser, et cartes
            resserrees pour reperer rapidement qui merite de l&apos;attention.
          </p>

          <div className="organizations-heroActions">
            <Link to="/app/etablissements/maintenance" className="organizations-actionLink is-primary">
              <ToolIcon />
              Maintenance ETS
            </Link>
          </div>

          <div className="organizations-kpis">
            <div className="organizations-kpi">
              <span className="organizations-kpiLabel">Total</span>
              <div className="organizations-kpiValue">{organizations.length}</div>
              <div className="organizations-kpiHint">etablissements charges</div>
            </div>
            <div className="organizations-kpi">
              <span className="organizations-kpiLabel">Actifs</span>
              <div className="organizations-kpiValue">{engagedOrganizations.length}</div>
              <div className="organizations-kpiHint">avec au moins une candidature</div>
            </div>
            <div className="organizations-kpi">
              <span className="organizations-kpiLabel">Taux moyen</span>
              <div className="organizations-kpiValue">{averageResponseRate}%</div>
              <div className="organizations-kpiHint">reponse moyenne du portefeuille</div>
            </div>
            <div className="organizations-kpi">
              <span className="organizations-kpiLabel">Volume</span>
              <div className="organizations-kpiValue">{totalApplications}</div>
              <div className="organizations-kpiHint">candidatures cumulees</div>
            </div>
          </div>
        </div>

        <aside className="organizations-sidebarPanel">
          <div className="organizations-sidebarStat">
            <span className="organizations-kpiLabel">Priorite du moment</span>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{watchlistOrganizations.length}</div>
            <div className="organizations-kpiHint">organisations a surveiller ou relancer</div>
          </div>
          <div className="organizations-sidebarStat">
            <span className="organizations-kpiLabel">Lecture rapide</span>
            <div className="organizations-kpiHint">
              Utilise les onglets pour separer les comptes engages, ceux qui repondent, et les relations plus froides.
            </div>
          </div>
          <div className="organizations-sidebarStat">
            <span className="organizations-kpiLabel">Filtre applique</span>
            <div className="organizations-kpiHint">
              {typeFilter ? organizationTypeLabels[typeFilter as OrganizationType] : 'Tous les types'}
              {search ? ` • recherche "${search}"` : ''}
            </div>
          </div>
        </aside>
      </section>

      <section className="organizations-filterPanel">
        <div className="organizations-filterGrid">
          <input
            className="organizations-search"
            placeholder="Rechercher un etablissement, une ville, un signal..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="organizations-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">Tous les types</option>
            {organizationTypes.map((type) => (
              <option key={type} value={type}>
                {organizationTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="organizations-filterMeta">
          <div className="organizations-resultsText">
            {loading ? 'Chargement des etablissements...' : `${visibleOrganizations.length} resultat(s) dans l'onglet courant`}
          </div>
          <div className="organizations-typePills">
            {organizationTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`organizations-pill ${typeFilter === type ? 'is-active' : ''}`}
                onClick={() => setTypeFilter((current) => (current === type ? '' : type))}
              >
                {organizationTypeLabels[type]} ({typeCounts[type] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="organizations-listPanel">
        <div className="organizations-listHeader">
          <div>
            <span className="organizations-kpiLabel">Tri visuel</span>
            <div className="organizations-tabs">
              {tabDefinitions.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`organizations-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="organizations-resultsText">
            {tabDefinitions.find((tab) => tab.id === activeTab)?.hint}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="organizations-errorState">{error}</div>
        ) : visibleOrganizations.length === 0 ? (
          <div className="organization-empty">Aucun etablissement ne correspond aux filtres actuels.</div>
        ) : (
          <div className="organizations-grid">
            {visibleOrganizations.map((organization) => {
              const positiveRate = getPositiveRate(organization);
              const rejectionRate = getRejectionRate(organization);
              const health = getHealthBucket(organization);
              const notePreview = organization.notes?.trim()
                ? organization.notes.trim().slice(0, 110)
                : 'Aucune note disponible pour cet etablissement.';

              return (
                <article
                  key={organization.id}
                  className="organization-card"
                  onClick={() => navigate(`/app/etablissements/${organization.id}`)}
                >
                  <div className="organization-cardHeader">
                    <span className="organization-typeBadge">{organizationTypeLabels[organization.type]}</span>
                    <span className={`organization-healthBadge ${health.tone}`}>{health.label}</span>
                  </div>

                  <h3 className="organization-cardTitle">{organization.name}</h3>

                  <div className="organization-cardMeta">
                    <div className="organization-cardSubtitle">{organization.city || 'Ville non renseignee'}</div>
                    {organization.website ? (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer"
                        className="organization-link"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Voir le site
                      </a>
                    ) : null}
                  </div>

                  <p className="organization-note">
                    {notePreview}
                    {organization.notes && organization.notes.trim().length > 110 ? '...' : ''}
                  </p>

                  <div className="organization-stats">
                    <div className="organization-stat">
                      <span className="organization-statLabel">Candidatures</span>
                      <div className="organization-statValue">{organization.total_applications ?? 0}</div>
                      <div className="organization-cardHint">activite cumulee</div>
                    </div>
                    <div className="organization-stat">
                      <span className="organization-statLabel">Taux de reponse</span>
                      <div className="organization-statValue">{organization.response_rate ?? 0}%</div>
                      <div className="organization-progress">
                        <div
                          className="organization-progressBar"
                          style={{ width: `${Math.max(0, Math.min(100, organization.response_rate ?? 0))}%` }}
                        />
                      </div>
                    </div>
                    <div className="organization-stat">
                      <span className="organization-statLabel">Taux positif</span>
                      <div className="organization-statValue">{positiveRate}%</div>
                      <div className="organization-cardHint">retours constructifs</div>
                    </div>
                    <div className="organization-stat">
                      <span className="organization-statLabel">Taux de rejet</span>
                      <div className="organization-statValue">{rejectionRate}%</div>
                      <div className="organization-cardHint">signal a surveiller</div>
                    </div>
                  </div>

                  <div className="organization-cardFooter">
                    <div>
                      <div className="organization-statLabel">Derniere interaction</div>
                      <div className="organization-footerText">{formatDate(organization.updated_at)}</div>
                    </div>
                    <div className="organization-footerText">Ouvrir la fiche detail</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
