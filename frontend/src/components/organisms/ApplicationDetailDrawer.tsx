import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService } from '../../services/api';
import type { ApplicationDetailsResponse } from '../../services/api';
import type { Contact } from '../../types';
import { StatusBadge } from '../atoms/StatusBadge';
import { OrganizationTypeBadge } from '../atoms/OrganizationTypeBadge';
import { ProbityBadge } from '../atoms/ProbityBadge';
import { Button } from '../atoms/Button';
import { LoadingStatus } from '../atoms/LoadingStatus';
import { Dialog } from '../molecules/Dialog';
import { Tabs } from '../molecules/Tabs';
import { ApplicationEditModal } from './ApplicationEditModal';
import classes from './DetailDialog.module.css';

interface ApplicationDetailDrawerProps { appId: number | null; onClose: () => void; onUpdate: () => void; }

export function ApplicationDetailDrawer({ appId, onClose, onUpdate }: ApplicationDetailDrawerProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<ApplicationDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'timeline'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!appId) return;
    let active = true;
    applicationService.getApplication(appId)
      .then((result) => { if (active) { setData(result); setError(null); setTab('overview'); } })
      .catch(() => { if (active) setError('Cette candidature est temporairement indisponible.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appId]);

  if (!appId) return null;
  return <Dialog eyebrow="Fiche candidature" title={data?.application.title || 'Candidature'} onClose={onClose}>
    <div className={classes.content}>
      {loading && <LoadingStatus>Chargement de la candidature…</LoadingStatus>}
      {error && <p className={classes.error} role="alert">{error}</p>}
      {!loading && data && <>
        <div className={classes.meta}><StatusBadge status={data.application.status} />{data.organization?.type && <OrganizationTypeBadge type={data.organization.type} size="xs" />}<span className={classes.muted}>{data.application.organization?.name || data.application.company_name}</span></div>
        <Tabs label="Détails de la candidature" value={tab} items={[["overview", "Aperçu"], ["timeline", "Historique"]] as const} onChange={setTab} />
        {tab === 'overview' ? <div className={classes.panel}>
          {data.organization && <ProbityBadge score={data.organization.metrics?.probity_score} level={data.organization.metrics?.probity_level || 'insuffisant'} size="md" />}
          <section className={classes.section}><p className={classes.label}>Informations</p><div className={classes.grid}><div><p className={classes.label}>Candidaté le</p><p className={classes.value}>{new Date(data.application.applied_at).toLocaleDateString()}</p></div><div><p className={classes.label}>Canal</p><p className={classes.value}>{data.application.channel || 'Non renseigné'}</p></div></div></section>
          <section className={classes.section}><p className={classes.label}>Notes</p><p className={classes.muted}>{data.application.notes || 'Aucune note.'}</p></section>
          {data.contacts?.length > 0 && <section className={classes.section}><p className={classes.label}>Contacts</p><div className={classes.list}>{data.contacts.map((contact: Contact) => <div className={classes.row} key={contact.id}><span className={classes.value}>{contact.first_name} {contact.last_name}</span><span className={classes.muted}>{contact.role}</span></div>)}</div></section>}
        </div> : <div className={classes.panel}><section className={classes.timeline}>{data.events?.length ? data.events.map((event, index) => <article className={classes.event} key={event.id || index}><p className={classes.value}>{event.type}</p><p className={classes.muted}>{new Date(event.ts).toLocaleString()}</p>{event.payload && Object.keys(event.payload).length > 0 && <p className={classes.muted}>{JSON.stringify(event.payload)}</p>}</article>) : <p className={classes.muted}>Aucun événement enregistré.</p>}</section></div>}
        <div className={classes.actions}><Button variant="ghost" onClick={() => setShowEditModal(true)}>Modifier</Button><Button variant="secondary" onClick={() => navigate(`/app/candidatures/${appId}`)}>Ouvrir la fiche</Button></div>
      </>}
      {!loading && !data && !error && <p className={classes.muted}>Candidature introuvable.</p>}
    </div>
    {showEditModal && data && <ApplicationEditModal application={data.application} onClose={() => setShowEditModal(false)} onSaved={async (payload) => { await applicationService.updateApplication(appId, payload); setData(await applicationService.getApplication(appId)); setShowEditModal(false); onUpdate(); }} />}
  </Dialog>;
}
