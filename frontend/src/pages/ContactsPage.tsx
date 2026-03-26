import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactService, organizationService } from '../services/api';
import { Title } from '../components/atoms/Title';
import { Spinner } from '../components/atoms/Spinner';
import type { Contact, Organization } from '../types';
import OrganizationTypeBadge from '../components/atoms/OrganizationTypeBadge';
import ProbityBadge from '../components/atoms/ProbityBadge';
import { Button } from '../components/atoms/Button';
import ContactCreateModal from '../components/organisms/ContactCreateModal';
import { useI18n } from '../i18n';

type ContactTab = 'all' | 'recruiters' | 'linked' | 'unlinked';

const pageStyles = `
  .contacts-shell {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 32px 36px;
  }

  .contacts-hero,
  .contacts-filterPanel,
  .contacts-listPanel,
  .contact-card,
  .contacts-sideCard {
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    border-radius: 20px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .contacts-hero {
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.85fr);
    gap: 24px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--bg-mantle) 92%, white 8%), color-mix(in srgb, var(--bg-crust) 68%, var(--bg-mantle) 32%));
  }

  .contacts-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    font-weight: 700;
  }

  .contacts-copy,
  .contacts-muted {
    color: var(--text-dim);
    line-height: 1.6;
  }

  .contacts-actions,
  .contacts-tabs,
  .contacts-meta,
  .contacts-orgMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .contacts-actions {
    margin-top: 18px;
  }

  .contacts-sideCard,
  .contacts-filterPanel,
  .contacts-listPanel {
    padding: 20px;
  }

  .contacts-tabs {
    margin-top: 10px;
  }

  .contacts-tab {
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    border-radius: 999px;
    background: transparent;
    color: var(--text-dim);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .contacts-tab.is-active {
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
    color: var(--text-main);
  }

  .contacts-searchRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
  }

  .contacts-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .contact-card {
    padding: 18px;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .contact-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--accent) 44%, var(--border) 56%);
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.18);
  }

  .contact-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .contact-name {
    margin: 0;
    font-size: 22px;
    line-height: 1.15;
  }

  .contact-detailGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .contact-stat {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-base) 76%, var(--bg-mantle) 24%);
  }

  .contact-empty {
    padding: 36px 16px;
    text-align: center;
    color: var(--text-dim);
  }

  @media (max-width: 1100px) {
    .contacts-hero,
    .contacts-grid,
    .contacts-searchRow {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .contacts-shell {
      padding: 18px;
      gap: 18px;
    }

    .contact-detailGrid {
      grid-template-columns: 1fr;
    }
  }
`;

export const ContactsPage: React.FC = () => {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ContactTab>('all');
  const navigate = useNavigate();
  const tabs: Array<{ id: ContactTab; label: string; hint: string }> = [
    { id: 'all', label: `◌ ${t('contacts.tabAll')}`, hint: t('contacts.tabAllHint') },
    { id: 'recruiters', label: `◎ ${t('contacts.tabRecruiters')}`, hint: t('contacts.tabRecruitersHint') },
    { id: 'linked', label: `↗ ${t('contacts.tabLinked')}`, hint: t('contacts.tabLinkedHint') },
    { id: 'unlinked', label: `⊘ ${t('contacts.tabUnlinked')}`, hint: t('contacts.tabUnlinkedHint') },
  ];

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch {
      setError(t('contacts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    organizationService.getAll().then(setOrganizations).catch(() => {});
  }, []);

  const organizationsMap = useMemo(() => new Map(organizations.map((org) => [org.id, org])), [organizations]);

  const visibleContacts = contacts.filter((contact) => {
    const matchesSearch = `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(search.toLowerCase())
      || (contact.role && contact.role.toLowerCase().includes(search.toLowerCase()))
      || (contact.email && contact.email.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) {
      return false;
    }

    switch (activeTab) {
      case 'recruiters':
        return !!contact.is_recruiter;
      case 'linked':
        return !!contact.organization_id;
      case 'unlinked':
        return !contact.organization_id;
      default:
        return true;
    }
  });

  const recruitersCount = contacts.filter((contact) => !!contact.is_recruiter).length;
  const linkedCount = contacts.filter((contact) => !!contact.organization_id).length;

  return (
    <div className="contacts-shell">
      <style>{pageStyles}</style>

      <section className="contacts-hero">
        <div>
          <div className="contacts-label">◌ {t('contacts.kicker')}</div>
          <Title>{t('contacts.title')}</Title>
          <p className="contacts-copy">{t('contacts.copy')}</p>
          <div className="contacts-actions">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>{t('contacts.newContact')}</Button>
          </div>
        </div>

        <aside className="contacts-sideCard">
          <div>
            <div className="contacts-label">◌ {t('contacts.total')}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{contacts.length}</div>
            <div className="contacts-muted">{t('contacts.totalHint')}</div>
          </div>
          <div>
            <div className="contacts-label">◎ {t('contacts.recruiters')}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{recruitersCount}</div>
            <div className="contacts-muted">{t('contacts.recruitersHint')}</div>
          </div>
          <div>
            <div className="contacts-label">↗ {t('contacts.linked')}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{linkedCount}</div>
            <div className="contacts-muted">{t('contacts.linkedHint')}</div>
          </div>
        </aside>
      </section>

      <section className="contacts-filterPanel">
        <div className="contacts-searchRow">
          <input
            className="input"
            placeholder={t('contacts.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="contacts-muted">{loading ? t('contacts.loading') : `${visibleContacts.length} ${t('contacts.results')}`}</div>
        </div>
        <div className="contacts-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`contacts-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="contacts-muted">{tabs.find((tab) => tab.id === activeTab)?.hint}</div>
      </section>

      <section className="contacts-listPanel">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : visibleContacts.length > 0 ? (
          <div className="contacts-grid">
            {visibleContacts.map((contact) => {
              const organization = contact.organization_id ? organizationsMap.get(contact.organization_id) : null;
              return (
                <article key={contact.id} className="contact-card" onClick={() => navigate(`/contacts/${contact.id}`)}>
                  <div className="contact-top">
                    <div>
                      <h3 className="contact-name">{contact.first_name} {contact.last_name}</h3>
                      <div className="contacts-muted">{contact.role || t('contacts.noRole')}</div>
                    </div>
                    {contact.is_recruiter ? (
                      <span className="contacts-label" style={{ color: '#fb7185' }}>◎ {t('contacts.recruiter')}</span>
                    ) : null}
                  </div>

                  <div className="contacts-orgMeta" style={{ marginTop: 12 }}>
                    {organization ? (
                      <>
                        <OrganizationTypeBadge type={organization.type} size="xs" />
                        <ProbityBadge score={organization.probity_score} level={organization.probity_level} showScore={false} />
                        <span className="contacts-muted">{organization.name}</span>
                      </>
                    ) : (
                      <span className="contacts-muted">{t('contacts.noOrg')}</span>
                    )}
                  </div>

                  <div className="contact-detailGrid">
                    <div className="contact-stat">
                      <div className="contacts-label">✉ {t('contacts.email')}</div>
                      <div className="contacts-muted" style={{ marginTop: 8 }}>{contact.email || t('contacts.notDefined')}</div>
                    </div>
                    <div className="contact-stat">
                      <div className="contacts-label">☎ {t('contacts.phone')}</div>
                      <div className="contacts-muted" style={{ marginTop: 8 }}>{contact.phone || t('contacts.notDefined')}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center" style={{ marginTop: 16 }}>
                    <span className="contacts-muted">{t('contacts.updated')} {new Date(contact.updated_at).toLocaleDateString('fr-FR')}</span>
                    <span className="contacts-muted">{t('contacts.openCard')}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="contact-empty">{t('contacts.noMatches')}</div>
        )}
      </section>
      {showCreateModal ? (
        <ContactCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchContacts();
            organizationService.getAll().then(setOrganizations).catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
};
