import React, { useEffect, useMemo, useState } from 'react';
import type { Contact, Organization, OrganizationType } from '../../types';
import { contactService, organizationService } from '../../services/api';
import { Button } from '../atoms/Button';

interface OrganizationEditModalProps {
  organization?: Organization | null;
  initialName?: string;
  initialType?: OrganizationType;
  onClose: () => void;
  onSaved: (org?: Organization) => void;
}

const modalStyles = `
  .orgedit-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.66);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .orgedit-modal {
    width: min(980px, 100%);
    max-height: calc(100vh - 32px);
    overflow: auto;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent 14%);
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 28%),
      linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle));
    box-shadow: 0 28px 64px rgba(0, 0, 0, 0.28);
    padding: 24px;
    color: var(--text-main);
  }

  .orgedit-header,
  .orgedit-actions,
  .orgedit-contactRow,
  .orgedit-contactMeta,
  .orgedit-searchResult,
  .orgedit-tagRow {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .orgedit-header,
  .orgedit-actions,
  .orgedit-searchResult {
    justify-content: space-between;
  }

  .orgedit-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
    gap: 18px;
    margin-top: 18px;
  }

  .orgedit-card {
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    background: color-mix(in srgb, var(--bg-base) 70%, var(--bg-mantle) 30%);
    padding: 18px;
  }

  .orgedit-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .orgedit-grid .orgedit-span2 {
    grid-column: 1 / -1;
  }

  .orgedit-label,
  .orgedit-sectionKicker,
  .orgedit-muted {
    display: block;
    color: var(--text-dim);
  }

  .orgedit-label,
  .orgedit-sectionKicker {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .orgedit-muted {
    font-size: 13px;
    line-height: 1.5;
  }

  .orgedit-input,
  .orgedit-textarea,
  .orgedit-select {
    width: 100%;
  }

  .orgedit-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-dim);
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-crust) 68%, var(--bg-surface) 32%);
  }

  .orgedit-contactList,
  .orgedit-searchList {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .orgedit-contactCard,
  .orgedit-searchCard {
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 82%, transparent 18%);
    background: color-mix(in srgb, var(--bg-crust) 64%, var(--bg-surface) 36%);
    padding: 14px;
  }

  .orgedit-searchBox {
    position: relative;
  }

  .orgedit-searchDropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 20;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border) 84%, transparent 16%);
    background: color-mix(in srgb, var(--bg-crust) 78%, var(--bg-mantle) 22%);
    box-shadow: 0 18px 30px rgba(0, 0, 0, 0.22);
    overflow: hidden;
  }

  .orgedit-searchOption {
    width: 100%;
    padding: 14px 16px;
    text-align: left;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .orgedit-searchOption:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .orgedit-empty {
    padding: 18px;
    text-align: center;
    border-radius: 16px;
    border: 1px dashed color-mix(in srgb, var(--border) 72%, transparent 28%);
    color: var(--text-dim);
  }

  @media (max-width: 860px) {
    .orgedit-layout,
    .orgedit-grid {
      grid-template-columns: 1fr;
    }

    .orgedit-grid .orgedit-span2 {
      grid-column: auto;
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

const emptyContactForm = {
  first_name: '',
  last_name: '',
  role: '',
  email: '',
  phone: '',
  linkedin_url: '',
  notes: '',
};

const OrganizationEditModal: React.FC<OrganizationEditModalProps> = ({
  organization,
  initialName,
  initialType = 'AUTRE',
  onClose,
  onSaved,
}) => {
  const isCreate = !organization;
  const [form, setForm] = useState<Partial<Organization>>({
    name: initialName || organization?.name || '',
    type: initialType || organization?.type || 'AUTRE',
    city: organization?.city || '',
    website: organization?.website || '',
    linkedin_url: organization?.linkedin_url || '',
    notes: organization?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [linkingContactId, setLinkingContactId] = useState<number | null>(null);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContact, setNewContact] = useState(emptyContactForm);

  useEffect(() => {
    setForm({
      name: initialName || organization?.name || '',
      type: initialType || organization?.type || 'AUTRE',
      city: organization?.city || '',
      website: organization?.website || '',
      linkedin_url: organization?.linkedin_url || '',
      notes: organization?.notes || '',
    });
  }, [organization, initialName, initialType]);

  const loadContacts = async () => {
    if (!organization) {
      return;
    }

    setContactsLoading(true);
    setContactError(null);
    try {
      const [currentContacts, allContacts] = await Promise.all([
        contactService.getAll({ organization_id: organization.id }),
        contactService.getAll(),
      ]);
      setLinkedContacts(currentContacts);
      setAvailableContacts(
        allContacts.filter((contact) => !currentContacts.some((current) => current.id === contact.id)),
      );
    } catch (loadError: any) {
      setContactError(loadError.response?.data?.detail || 'Impossible de charger les contacts de cet ETS.');
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [organization?.id]);

  const filteredContacts = useMemo(() => {
    const needle = contactQuery.trim().toLowerCase();
    if (!needle) {
      return availableContacts.slice(0, 6);
    }
    return availableContacts
      .filter((contact) => {
        const fullName = `${contact.first_name} ${contact.last_name}`.trim().toLowerCase();
        return fullName.includes(needle) || (contact.email || '').toLowerCase().includes(needle);
      })
      .slice(0, 6);
  }, [availableContacts, contactQuery]);

  const handleOrganizationChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleNewContactChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewContact((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isCreate) {
        const created = await organizationService.create({
          name: form.name,
          type: form.type,
          city: form.city || null,
          website: form.website || null,
          linkedin_url: form.linkedin_url || null,
          notes: form.notes || null,
        });
        const full = await organizationService.getById(created.id);
        onSaved(full);
      } else if (organization) {
        await organizationService.update(organization.id, form);
        onSaved();
      }
    } catch (submitError: any) {
      setError(submitError.response?.data?.detail || "Echec de la sauvegarde de l'ETS.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExistingContact = async (contact: Contact) => {
    if (!organization) {
      return;
    }
    setLinkingContactId(contact.id);
    setContactError(null);
    try {
      await contactService.update(contact.id, { organization_id: organization.id });
      setContactQuery('');
      setShowContactDropdown(false);
      await loadContacts();
      onSaved();
    } catch (linkError: any) {
      setContactError(linkError.response?.data?.detail || 'Impossible de rattacher ce contact.');
    } finally {
      setLinkingContactId(null);
    }
  };

  const handleCreateContact = async () => {
    if (!organization) {
      return;
    }
    setCreatingContact(true);
    setContactError(null);
    try {
      await contactService.create({
        ...newContact,
        organization_id: organization.id,
      });
      setNewContact(emptyContactForm);
      await loadContacts();
      onSaved();
    } catch (createError: any) {
      setContactError(createError.response?.data?.detail || 'Impossible de creer le contact.');
    } finally {
      setCreatingContact(false);
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="orgedit-overlay" onClick={onClose}>
        <div className="orgedit-modal" onClick={(event) => event.stopPropagation()}>
          <div className="orgedit-header">
            <div>
              <div className="orgedit-sectionKicker">{isCreate ? 'Creation ETS' : 'Edition ETS'}</div>
              <h2 className="text-xl font-bold" style={{ margin: '4px 0 0' }}>
                {isCreate ? 'Creer un etablissement' : "Modifier l'ETS"}
              </h2>
            </div>
            <Button variant="ghost" size="small" onClick={onClose}>Fermer</Button>
          </div>

          {error ? <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div> : null}

          <form onSubmit={handleSubmit}>
            <div className="orgedit-layout">
              <section className="orgedit-card">
                <div className="orgedit-sectionKicker">Informations principales</div>
                <div className="orgedit-grid">
                  <div className="orgedit-span2">
                    <label className="orgedit-label">Nom</label>
                    <input
                      name="name"
                      className="input orgedit-input"
                      required
                      value={form.name || ''}
                      onChange={handleOrganizationChange}
                    />
                  </div>
                  <div>
                    <label className="orgedit-label">Type</label>
                    <select
                      name="type"
                      className="input orgedit-select"
                      value={(form.type as OrganizationType) || 'AUTRE'}
                      onChange={handleOrganizationChange}
                    >
                      {organizationTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="orgedit-label">Ville</label>
                    <input
                      name="city"
                      className="input orgedit-input"
                      value={(form.city as string) || ''}
                      onChange={handleOrganizationChange}
                    />
                    <span className="orgedit-muted">Champ affiche dans le front, non encore persiste cote API.</span>
                  </div>
                  <div>
                    <label className="orgedit-label">Site web</label>
                    <input
                      name="website"
                      className="input orgedit-input"
                      value={(form.website as string) || ''}
                      onChange={handleOrganizationChange}
                    />
                  </div>
                  <div>
                    <label className="orgedit-label">LinkedIn</label>
                    <input
                      name="linkedin_url"
                      className="input orgedit-input"
                      value={(form.linkedin_url as string) || ''}
                      onChange={handleOrganizationChange}
                    />
                    <span className="orgedit-muted">Champ affiche dans le front, non encore persiste cote API.</span>
                  </div>
                  <div className="orgedit-span2">
                    <label className="orgedit-label">Notes</label>
                    <textarea
                      name="notes"
                      className="input orgedit-textarea"
                      rows={4}
                      value={(form.notes as string) || ''}
                      onChange={handleOrganizationChange}
                    />
                  </div>
                </div>
              </section>

              <section className="orgedit-card">
                <div className="orgedit-sectionKicker">Portee de la fiche</div>
                <div className="orgedit-contactList">
                  <div className="orgedit-searchCard">
                    <div className="orgedit-label">Statut</div>
                    <div className="orgedit-tagRow">
                      <span className="orgedit-pill">{isCreate ? 'Nouvel ETS' : 'ETS existant'}</span>
                      {!isCreate && organization ? (
                        <span className="orgedit-pill">{linkedContacts.length} contact(s) lie(s)</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="orgedit-searchCard">
                    <div className="orgedit-label">Usage</div>
                    <div className="orgedit-muted">
                      {isCreate
                        ? "Cree d'abord l'ETS. L'ajout de contacts devient disponible juste apres."
                        : 'Tu peux lier un contact existant ou en creer un nouveau sans quitter cette modale.'}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {!isCreate && organization ? (
              <div className="orgedit-layout" style={{ marginTop: 18 }}>
                <section className="orgedit-card">
                  <div className="orgedit-sectionKicker">Contacts lies</div>
                  {contactsLoading ? (
                    <div className="orgedit-empty">Chargement des contacts...</div>
                  ) : linkedContacts.length > 0 ? (
                    <div className="orgedit-contactList">
                      {linkedContacts.map((contact) => (
                        <div key={contact.id} className="orgedit-contactCard">
                          <div className="orgedit-searchResult">
                            <div>
                              <div className="font-bold">{contact.first_name} {contact.last_name}</div>
                              <div className="orgedit-contactMeta" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                                {contact.role ? <span className="orgedit-pill">{contact.role}</span> : null}
                                {contact.email ? <span className="orgedit-pill">{contact.email}</span> : null}
                                {contact.phone ? <span className="orgedit-pill">{contact.phone}</span> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="orgedit-empty">Aucun contact rattache a cet ETS pour le moment.</div>
                  )}
                </section>

                <section className="orgedit-card">
                  <div className="orgedit-sectionKicker">Ajouter un contact</div>
                  {contactError ? <div className="alert alert-error" style={{ marginBottom: 14 }}>{contactError}</div> : null}

                  <div className="orgedit-searchBox" style={{ marginBottom: 18 }}>
                    <label className="orgedit-label">Lier un contact existant</label>
                    <input
                      className="input orgedit-input"
                      placeholder="Rechercher un nom ou un email..."
                      value={contactQuery}
                      onChange={(event) => {
                        setContactQuery(event.target.value);
                        setShowContactDropdown(true);
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                    />
                    {showContactDropdown && filteredContacts.length > 0 ? (
                      <div className="orgedit-searchDropdown">
                        {filteredContacts.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            className="orgedit-searchOption"
                            onClick={() => handleLinkExistingContact(contact)}
                            disabled={linkingContactId === contact.id}
                          >
                            <div className="orgedit-searchResult">
                              <div>
                                <div className="font-bold">{contact.first_name} {contact.last_name}</div>
                                <div className="orgedit-contactMeta" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                                  {contact.role ? <span className="orgedit-pill">{contact.role}</span> : null}
                                  {contact.email ? <span className="orgedit-pill">{contact.email}</span> : null}
                                </div>
                              </div>
                              <span className="orgedit-pill">
                                {linkingContactId === contact.id ? 'Ajout...' : 'Ajouter'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {showContactDropdown && contactQuery.trim() && filteredContacts.length === 0 ? (
                      <div className="orgedit-empty" style={{ marginTop: 10 }}>
                        Aucun contact existant ne correspond a cette recherche.
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="orgedit-label">Creer un nouveau contact</div>
                    <div className="orgedit-grid">
                      <div>
                        <input
                          name="first_name"
                          className="input orgedit-input"
                          placeholder="Prenom"
                          value={newContact.first_name}
                          onChange={handleNewContactChange}
                        />
                      </div>
                      <div>
                        <input
                          name="last_name"
                          className="input orgedit-input"
                          placeholder="Nom"
                          value={newContact.last_name}
                          onChange={handleNewContactChange}
                        />
                      </div>
                      <div>
                        <input
                          name="role"
                          className="input orgedit-input"
                          placeholder="Role"
                          value={newContact.role}
                          onChange={handleNewContactChange}
                        />
                      </div>
                      <div>
                        <input
                          name="email"
                          type="email"
                          className="input orgedit-input"
                          placeholder="Email"
                          value={newContact.email}
                          onChange={handleNewContactChange}
                        />
                      </div>
                      <div>
                        <input
                          name="phone"
                          className="input orgedit-input"
                          placeholder="Telephone"
                          value={newContact.phone}
                          onChange={handleNewContactChange}
                        />
                      </div>
                      <div>
                        <input
                          name="linkedin_url"
                          className="input orgedit-input"
                          placeholder="Lien LinkedIn"
                          value={newContact.linkedin_url}
                          onChange={handleNewContactChange}
                        />
                      </div>
                      <div className="orgedit-span2">
                        <textarea
                          name="notes"
                          className="input orgedit-textarea"
                          rows={3}
                          placeholder="Notes de contexte"
                          value={newContact.notes}
                          onChange={handleNewContactChange}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={creatingContact || !newContact.first_name.trim() || !newContact.last_name.trim()}
                        onClick={handleCreateContact}
                      >
                        {creatingContact ? 'Creation...' : 'Creer et rattacher'}
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            <div className="orgedit-actions" style={{ marginTop: 20 }}>
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Sauvegarde...' : isCreate ? 'Creer l ETS' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OrganizationEditModal;
