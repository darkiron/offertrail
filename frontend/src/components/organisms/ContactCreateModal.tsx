import React, { useEffect, useMemo, useState } from 'react';
import type { Contact, Organization } from '../../types';
import { contactService, organizationService } from '../../services/api';
import OrganizationTypeBadge from '../atoms/OrganizationTypeBadge';
import ProbityBadge from '../atoms/ProbityBadge';
import { Button } from '../atoms/Button';
import OrganizationEditModal from './OrganizationEditModal';
import { useI18n } from '../../i18n';

interface ContactCreateModalProps {
  onClose: () => void;
  onCreated: (contact?: Contact) => void;
}

const modalStyles = `
  .contactcreate-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .contactcreate-modal {
    width: min(820px, 100%);
    border-radius: 22px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
    padding: 22px;
  }

  .contactcreate-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .contactcreate-label {
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .contactcreate-orgBox {
    position: relative;
  }

  .contactcreate-dropdown {
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

  .contactcreate-option {
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    cursor: pointer;
  }

  .contactcreate-option:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .contactcreate-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
  }

  @media (max-width: 760px) {
    .contactcreate-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const ContactCreateModal: React.FC<ContactCreateModalProps> = ({ onClose, onCreated }) => {
  const { t } = useI18n();
  const [form, setForm] = useState<Partial<Contact>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    is_recruiter: 0,
    linkedin_url: '',
    notes: '',
    organization_id: null,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    const lowered = query.toLowerCase();
    return organizations.filter((org) => org.name.toLowerCase().includes(lowered)).slice(0, 6);
  }, [organizations, query]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await contactService.create(form);
      const full = await contactService.getById(created.id);
      onCreated(full);
      onClose();
    } catch (submitError: any) {
      setError(submitError.response?.data?.detail || t('contacts.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="contactcreate-overlay" onClick={onClose}>
        <div className="contactcreate-modal" onClick={(event) => event.stopPropagation()}>
          <div className="flex justify-between items-center mb-lg">
            <div>
              <div className="text-xs text-dim font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('contacts.createKicker')}
              </div>
              <h2 className="text-xl font-bold" style={{ margin: '6px 0 0' }}>{t('contacts.createTitle')}</h2>
            </div>
            <Button variant="ghost" size="small" onClick={onClose}>{t('common.close')}</Button>
          </div>

          {error ? <div className="alert alert-error mb-lg">{error}</div> : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="contactcreate-grid">
              <div>
                <label className="contactcreate-label">{t('contacts.firstName')}</label>
                <input name="first_name" className="input" value={form.first_name || ''} onChange={handleChange} required />
              </div>
              <div>
                <label className="contactcreate-label">{t('contacts.lastName')}</label>
                <input name="last_name" className="input" value={form.last_name || ''} onChange={handleChange} required />
              </div>
              <div>
                <label className="contactcreate-label">{t('contacts.role')}</label>
                <input name="role" className="input" value={form.role || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="contactcreate-label">{t('contacts.email')}</label>
                <input name="email" type="email" className="input" value={form.email || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="contactcreate-label">{t('contacts.phone')}</label>
                <input name="phone" className="input" value={form.phone || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="contactcreate-label">LinkedIn</label>
                <input name="linkedin_url" className="input" value={form.linkedin_url || ''} onChange={handleChange} />
              </div>
              <div className="contactcreate-orgBox">
                <label className="contactcreate-label">{t('contacts.organization')}</label>
                <input
                  className="input"
                  placeholder={t('contacts.searchOrg')}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowDropdown(true);
                    setForm((current) => ({ ...current, organization_id: null }));
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filtered.length > 0 ? (
                  <div className="contactcreate-dropdown">
                    {filtered.map((org) => (
                      <div
                        key={org.id}
                        className="contactcreate-option"
                        onClick={() => {
                          setForm((current) => ({ ...current, organization_id: org.id }));
                          setQuery(org.name);
                          setShowDropdown(false);
                        }}
                      >
                        <div>
                          <div className="font-bold">{org.name}</div>
                          <div className="contactcreate-meta">
                            <OrganizationTypeBadge type={org.type} size="xs" />
                            <ProbityBadge score={org.probity_score} level={org.probity_level} showScore={false} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {!filtered.length && query.trim() ? (
                  <div className="contactcreate-meta">
                    <Button variant="ghost" size="small" type="button" onClick={() => setShowCreateOrg(true)}>
                      {t('contacts.createOrg')} "{query}"
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center" style={{ paddingTop: 22 }}>
                <label className="flex items-center gap-sm text-sm">
                  <input
                    name="is_recruiter"
                    type="checkbox"
                    checked={!!form.is_recruiter}
                    onChange={handleChange}
                  />
                  {t('contacts.recruiterContact')}
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="contactcreate-label">{t('contacts.notes')}</label>
                <textarea name="notes" className="input" rows={4} value={form.notes || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-between items-center mt-md">
              <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creation...' : t('contacts.createContact')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showCreateOrg ? (
        <OrganizationEditModal
          initialName={query}
          onClose={() => setShowCreateOrg(false)}
          onSaved={(org) => {
            setShowCreateOrg(false);
            if (org) {
              setOrganizations((current) => [org, ...current]);
              setForm((current) => ({ ...current, organization_id: org.id }));
              setQuery(org.name);
              setShowDropdown(false);
            }
          }}
        />
      ) : null}
    </>
  );
};

export default ContactCreateModal;
