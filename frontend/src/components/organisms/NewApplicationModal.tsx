import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService, organizationService } from '../../services/api';
import type { Organization, OrganizationType } from '../../types';
import ProbityBadge from '../atoms/ProbityBadge';
import OrganizationTypeBadge from '../atoms/OrganizationTypeBadge';
import { Button } from '../atoms/Button';
import { useI18n } from '../../i18n';

interface NewApplicationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const modalStyles = `
  .newapp-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.62);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .newapp-modal {
    width: min(980px, 100%);
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 26px 52px rgba(0, 0, 0, 0.24);
    padding: 22px;
  }

  .newapp-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .newapp-closeIcon {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 1;
  }

  .newapp-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.85fr);
    gap: 18px;
  }

  .newapp-card,
  .newapp-inlineOrg {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 18px;
    background: color-mix(in srgb, var(--bg-base) 76%, var(--bg-mantle) 24%);
    padding: 18px;
  }

  .newapp-label {
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .newapp-fieldGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .newapp-orgBox {
    position: relative;
  }

  .newapp-dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    background: color-mix(in srgb, var(--bg-crust) 78%, var(--bg-mantle) 22%);
    box-shadow: 0 18px 30px rgba(0, 0, 0, 0.22);
    overflow: hidden;
  }

  .newapp-option {
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    cursor: pointer;
  }

  .newapp-option:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .newapp-meta,
  .newapp-inlineHeader {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
  }

  .newapp-inlineHeader {
    justify-content: space-between;
    margin-top: 0;
    margin-bottom: 14px;
  }

  .newapp-muted {
    color: var(--text-dim);
    line-height: 1.6;
    font-size: 14px;
  }

  @media (max-width: 860px) {
    .newapp-grid,
    .newapp-fieldGrid {
      grid-template-columns: 1fr;
    }
  }
`;

const organizationTypeOptions: Array<{ value: OrganizationType; label: string }> = [
  { value: 'CLIENT_FINAL', label: 'Client final' },
  { value: 'ESN', label: 'ESN' },
  { value: 'CABINET_RECRUTEMENT', label: 'Cabinet' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'PME', label: 'PME' },
  { value: 'GRAND_COMPTE', label: 'Grand compte' },
  { value: 'PORTAGE', label: 'Portage' },
  { value: 'AUTRE', label: 'Autre' },
];

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({ onClose, onCreated }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    title: '',
    type: 'CDI',
    status: 'APPLIED',
    source: '',
    job_url: '',
    applied_at: new Date().toISOString().split('T')[0],
    next_followup_at: '',
    org_type: 'AUTRE' as OrganizationType,
  });
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    type: 'AUTRE' as OrganizationType,
    city: '',
    website: '',
    linkedin_url: '',
    notes: '',
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [finalCustomerSearch, setFinalCustomerSearch] = useState('');
  const [showFinalCustomerDropdown, setShowFinalCustomerDropdown] = useState(false);
  const [selectedFinalCustomer, setSelectedFinalCustomer] = useState<Organization | null>(null);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const filteredOrgs = useMemo(
    () => organizations.filter((org) => org.name.toLowerCase().includes(formData.company.toLowerCase())).slice(0, 6),
    [organizations, formData.company],
  );

  const matchedOrg = useMemo(
    () => organizations.find((org) => org.name.toLowerCase() === formData.company.toLowerCase()) || selectedOrg,
    [organizations, formData.company, selectedOrg],
  );
  const effectiveOrgType = matchedOrg?.type || (showCreateOrg ? newOrganization.type : formData.org_type);
  const needsFinalCustomer = effectiveOrgType === 'ESN' || effectiveOrgType === 'CABINET_RECRUTEMENT';
  const finalCustomerOptions = useMemo(
    () => organizations.filter((org) => !['ESN', 'CABINET_RECRUTEMENT', 'PORTAGE'].includes(org.type)),
    [organizations],
  );
  const filteredFinalCustomers = useMemo(
    () => finalCustomerOptions
      .filter((org) => org.name.toLowerCase().includes(finalCustomerSearch.toLowerCase()))
      .slice(0, 6),
    [finalCustomerOptions, finalCustomerSearch],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let organizationId = selectedOrg?.id || matchedOrg?.id || null;

      if (!organizationId && showCreateOrg && newOrganization.name.trim()) {
        const created = await organizationService.create({
          ...newOrganization,
          name: newOrganization.name.trim(),
          city: newOrganization.city || null,
          website: newOrganization.website || null,
          linkedin_url: newOrganization.linkedin_url || null,
          notes: newOrganization.notes || null,
        });
        const full = await organizationService.getById(created.id);
        setOrganizations((current) => [full, ...current]);
        organizationId = full.id;
      }

      await applicationService.createApplication({
        ...formData,
        company: formData.company.trim(),
        org_type: matchedOrg?.type || newOrganization.type || formData.org_type,
        organization_id: organizationId,
        final_customer_organization_id: selectedFinalCustomer?.id || null,
      });
      onCreated();
      onClose();
    } catch (submitError: any) {
      if (submitError.response?.status === 402) {
        onClose();
        navigate('/app/pricing?reason=limit_reached');
        return;
      }
      if (submitError.response?.status === 401) {
        onClose();
        navigate('/login');
        return;
      }
      setError(submitError.response?.data?.detail || t('newApplication.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (name === 'company') {
      setShowOrgDropdown(true);
      setSelectedOrg(null);
      setShowCreateOrg(false);
      setNewOrganization((current) => ({ ...current, name: value }));
    }
  };

  const handleOrganizationChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewOrganization((current) => ({ ...current, [name]: value }));
  };

  const selectOrg = (org: Organization) => {
    setFormData((current) => ({ ...current, company: org.name, org_type: org.type }));
    setSelectedOrg(org);
    setShowOrgDropdown(false);
    setShowCreateOrg(false);
    setNewOrganization({
      name: org.name,
      type: org.type,
      city: org.city || '',
      website: org.website || '',
      linkedin_url: org.linkedin_url || '',
      notes: org.notes || '',
    });
  };

  const selectFinalCustomer = (organization: Organization) => {
    setSelectedFinalCustomer(organization);
    setFinalCustomerSearch(organization.name);
    setShowFinalCustomerDropdown(false);
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="newapp-overlay" onClick={onClose}>
        <div className="newapp-modal" onClick={(event) => event.stopPropagation()}>
          <div className="newapp-header">
            <div>
              <div className="text-xs text-dim font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('newApplication.kicker')}
              </div>
              <h2 className="text-xl font-bold" style={{ margin: '6px 0 0' }}>{t('newApplication.title')}</h2>
            </div>
            <button
              type="button"
              className="btn-ghost newapp-closeIcon"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              ×
            </button>
          </div>

          {error ? <div className="alert alert-error mb-lg">{error}</div> : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="newapp-grid">
              <div className="newapp-card">
                <div className="newapp-label">◎ {t('newApplication.core')}</div>
                <div className="newapp-fieldGrid">
                  <div className="newapp-orgBox" style={{ gridColumn: '1 / -1' }}>
                    <label className="newapp-label">{t('newApplication.organization')}</label>
                    <input
                      name="company"
                      className="input"
                      placeholder={t('newApplication.organizationPlaceholder')}
                      value={formData.company}
                      onChange={handleChange}
                      onFocus={() => setShowOrgDropdown(true)}
                      autoComplete="off"
                    />
                    {showOrgDropdown && formData.company && filteredOrgs.length > 0 && !matchedOrg ? (
                      <div className="newapp-dropdown">
                        {filteredOrgs.map((org) => (
                          <div key={org.id} className="newapp-option" onClick={() => selectOrg(org)}>
                            <div>
                              <div className="font-bold">{org.name}</div>
                              <div className="newapp-meta">
                                <OrganizationTypeBadge type={org.type} size="xs" />
                                <ProbityBadge score={org.probity_score} level={org.probity_level} showScore={false} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {matchedOrg ? (
                      <div className="newapp-meta">
                        <OrganizationTypeBadge type={matchedOrg.type} size="xs" />
                        <ProbityBadge score={matchedOrg.probity_score} level={matchedOrg.probity_level} showScore={false} />
                        <span className="newapp-muted">{matchedOrg.name}</span>
                      </div>
                    ) : null}
                    {!matchedOrg && formData.company ? (
                      <div className="newapp-meta">
                        <Button
                          type="button"
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            setShowCreateOrg((current) => !current);
                            setNewOrganization((current) => ({ ...current, name: formData.company }));
                          }}
                        >
                          {t('newApplication.createOrg')} "{formData.company}"
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {showCreateOrg ? (
                    <div className="newapp-inlineOrg" style={{ gridColumn: '1 / -1' }}>
                      <div className="newapp-inlineHeader">
                        <div>
                          <div className="newapp-label">▣ Nouvel ETS</div>
                          <div className="newapp-muted">Creation inline dans la meme fenetre.</div>
                        </div>
                        <Button type="button" variant="ghost" size="small" onClick={() => setShowCreateOrg(false)}>
                          Replier
                        </Button>
                      </div>
                      <div className="newapp-fieldGrid">
                        <div>
                          <label className="newapp-label">Nom</label>
                          <input name="name" className="input" value={newOrganization.name} onChange={handleOrganizationChange} />
                        </div>
                        <div>
                          <label className="newapp-label">Type</label>
                          <select name="type" className="input" value={newOrganization.type} onChange={handleOrganizationChange}>
                            {organizationTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="newapp-label">Ville</label>
                          <input name="city" className="input" value={newOrganization.city} onChange={handleOrganizationChange} />
                        </div>
                        <div>
                          <label className="newapp-label">Site web</label>
                          <input name="website" className="input" value={newOrganization.website} onChange={handleOrganizationChange} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label className="newapp-label">LinkedIn</label>
                          <input name="linkedin_url" className="input" value={newOrganization.linkedin_url} onChange={handleOrganizationChange} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label className="newapp-label">Notes</label>
                          <textarea name="notes" className="input" rows={3} value={newOrganization.notes} onChange={handleOrganizationChange} />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="newapp-label">{t('newApplication.jobTitle')}</label>
                    <input name="title" className="input" required value={formData.title} onChange={handleChange} />
                  </div>

                  {needsFinalCustomer ? (
                    <div className="newapp-orgBox" style={{ gridColumn: '1 / -1' }}>
                      <label className="newapp-label">Client final</label>
                      <input
                        className="input"
                        placeholder="Rechercher le client final"
                        value={finalCustomerSearch}
                        onChange={(event) => {
                          setFinalCustomerSearch(event.target.value);
                          setSelectedFinalCustomer(null);
                          setShowFinalCustomerDropdown(true);
                        }}
                        onFocus={() => setShowFinalCustomerDropdown(true)}
                        autoComplete="off"
                      />
                      {showFinalCustomerDropdown && finalCustomerSearch && filteredFinalCustomers.length > 0 ? (
                        <div className="newapp-dropdown">
                          {filteredFinalCustomers.map((organization) => (
                            <div key={organization.id} className="newapp-option" onClick={() => selectFinalCustomer(organization)}>
                              <div>
                                <div className="font-bold">{organization.name}</div>
                                <div className="newapp-meta">
                                  <OrganizationTypeBadge type={organization.type} size="xs" />
                                  {organization.city ? <span className="newapp-muted">{organization.city}</span> : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="newapp-meta">
                        <span className="newapp-muted">
                          Lien utile quand la candidature passe par un cabinet ou une ESN.
                        </span>
                        {selectedFinalCustomer ? (
                          <>
                            <OrganizationTypeBadge type={selectedFinalCustomer.type} size="xs" />
                            <span className="newapp-muted">{selectedFinalCustomer.name}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="newapp-label">{t('newApplication.type')}</label>
                    <select name="type" className="input" value={formData.type} onChange={handleChange}>
                      <option value="CDI">CDI</option>
                      <option value="FREELANCE">FREELANCE</option>
                      <option value="CDD">CDD</option>
                      <option value="INTERN">INTERNSHIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="newapp-label">{t('newApplication.initialStatus')}</label>
                    <select name="status" className="input" value={formData.status} onChange={handleChange}>
                      <option value="INTERESTED">INTERESTED</option>
                      <option value="APPLIED">APPLIED</option>
                      <option value="INTERVIEW">INTERVIEW</option>
                      <option value="OFFER">OFFER</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="newapp-card">
                <div className="newapp-label">◷ {t('newApplication.tracking')}</div>
                <div className="newapp-fieldGrid">
                  <div>
                    <label className="newapp-label">{t('newApplication.appliedAt')}</label>
                    <input name="applied_at" type="date" className="input" value={formData.applied_at} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="newapp-label">{t('newApplication.nextFollowup')}</label>
                    <input name="next_followup_at" type="date" className="input" value={formData.next_followup_at} onChange={handleChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="newapp-label">{t('newApplication.source')}</label>
                    <input name="source" className="input" placeholder={t('newApplication.sourcePlaceholder')} value={formData.source} onChange={handleChange} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="newapp-label">{t('newApplication.jobUrl')}</label>
                    <input name="job_url" className="input" placeholder={t('newApplication.jobUrlPlaceholder')} value={formData.job_url} onChange={handleChange} />
                  </div>
                </div>
                <div className="newapp-meta" style={{ marginTop: 16 }}>
                  <div className="newapp-muted">{t('newApplication.tip')}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-md">
              <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creation...' : t('newApplication.createAction')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
