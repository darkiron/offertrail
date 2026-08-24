import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type OrganizationDetails,
} from '../../services/api/organizations';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { StatusBadge } from '../atoms/StatusBadge';
import { Button } from '../atoms/Button';
import { LoadingStatus } from '../atoms/LoadingStatus';
import { Dialog } from '../molecules/Dialog';
import { Tabs } from '../molecules/Tabs';
import OrganizationEditModal from './OrganizationEditModal';
import classes from './DetailDialog.module.css';

interface OrganizationDetailDrawerProps {
  organizationId: number | null;
  onClose: () => void;
  onUpdate: () => void;
}
export function OrganizationDetailDrawer({
  organizationId,
  onClose,
  onUpdate,
}: OrganizationDetailDrawerProps) {
  const [data, setData] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'applications' | 'contacts'>(
    'overview',
  );
  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.getCompany(organizationId));
    } catch {
      setError('Cet établissement est temporairement indisponible.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  useEffect(() => {
    if (organizationId) void loadData();
  }, [organizationId, loadData]);
  if (!organizationId) return null;
  return (
    <Dialog
      eyebrow="Portefeuille relationnel"
      title={data?.name || 'Établissement'}
      onClose={onClose}
    >
      <div className={classes.content}>
        {loading && (
          <LoadingStatus>Chargement de l’établissement…</LoadingStatus>
        )}
        {error && (
          <p className={classes.error} role="alert">
            {error}
          </p>
        )}
        {!loading && data && (
          <>
            <div className={classes.meta}>
              <OrganizationTypeBadge type={data.type} size="sm" />
              <div className={classes.links}>
                {data.linkedin_url && (
                  <a
                    className={classes.link}
                    href={data.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                )}
                {data.website && (
                  <a
                    className={classes.link}
                    href={data.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Site web
                  </a>
                )}
              </div>
            </div>
            <Tabs
              label="Détails de l’établissement"
              value={tab}
              items={
                [
                  ['overview', 'Aperçu'],
                  ['applications', 'Candidatures'],
                  ['contacts', 'Contacts'],
                ] as const
              }
              onChange={setTab}
            >
              {tab === 'overview' && (
                <div className={classes.panel}>
                  <ProbityBadge
                    score={data.metrics.probity_score}
                    level={data.metrics.probity_level}
                    size="md"
                  />
                  <section className={classes.section}>
                    <p className={classes.label}>À propos</p>
                    <p className={classes.muted}>
                      {data.notes || 'Aucune note.'}
                    </p>
                    <div className={classes.grid}>
                      <div>
                        <p className={classes.label}>Localisation</p>
                        <p className={classes.value}>
                          {data.city || 'Non spécifiée'}
                        </p>
                      </div>
                      <div>
                        <p className={classes.label}>Créé le</p>
                        <p className={classes.value}>
                          {new Date(data.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}
              {tab === 'applications' && (
                <div className={classes.panel}>
                  <div className={classes.list}>
                    {data.applications?.length ? (
                      data.applications.map((application) => (
                        <div className={classes.row} key={application.id}>
                          <div>
                            <p className={classes.value}>{application.title}</p>
                            <p className={classes.muted}>
                              {new Date(
                                application.applied_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={application.status} />
                        </div>
                      ))
                    ) : (
                      <p className={classes.muted}>
                        Aucune candidature pour cet établissement.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {tab === 'contacts' && (
                <div className={classes.panel}>
                  <div className={classes.list}>
                    {data.contacts?.length ? (
                      data.contacts.map((contact) => (
                        <div className={classes.card} key={contact.id}>
                          <p className={classes.value}>
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className={classes.muted}>
                            {contact.role || 'Rôle non renseigné'}
                          </p>
                          {contact.email && (
                            <p className={classes.muted}>{contact.email}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className={classes.muted}>Aucun contact enregistré.</p>
                    )}
                  </div>
                </div>
              )}
            </Tabs>
            <div className={classes.actions}>
              <Button variant="primary" onClick={() => setEditing(true)}>
                Modifier l’établissement
              </Button>
            </div>
          </>
        )}
        {!loading && !data && !error && (
          <p className={classes.muted}>Établissement introuvable.</p>
        )}
      </div>
      {editing && data && (
        <OrganizationEditModal
          organization={data}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await loadData();
            onUpdate();
          }}
        />
      )}
    </Dialog>
  );
}
