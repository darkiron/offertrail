import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContactDetails } from '../features/relationships/queries';
import {
  toLegacyContactId,
  toLegacyOrganizationId,
} from '../services/api/identifiers';
import ContactEditModal from '@widgets/contacts/ContactEditModal';
import { DetailHeader } from '@shared/ui/DetailHeader';
import { ActionButton, ExternalAction } from '@shared/ui/Action';
import { LoadingStatus } from '@shared/ui/LoadingStatus';
import { DetailSummary } from '@shared/ui/DetailSummary';
import { RelatedRecord, RelatedRecords } from '@shared/ui/RelatedRecords';
import { Tabs } from '@shared/ui/Tabs';
import { EntityLink } from '@shared/ui/EntityLink';
import classes from './ContactDetailsPage.module.scss';
import { useI18n } from '../i18n';
import {
  formatRelationshipDate,
  normalizeRelationshipKey,
  relationshipErrorStatus,
  relationshipCopy,
} from '../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../features/relationships/auth';

type Tab = 'overview' | 'applications' | 'activity';
export const ContactDetailsPage = () => {
  const { locale } = useI18n();
  const copy = relationshipCopy(locale);
  const c = copy.contacts;
  const date = (value?: string | null) =>
    formatRelationshipDate(value, locale, copy.common.missing);
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const navigationState = location.state as {
    from?: string;
    scrollY?: number;
  } | null;
  const from = navigationState?.from ?? '/app/contacts';
  const query = useContactDetails(id);
  const data = query.data;
  useRelationshipAuthRedirect(query.error);

  useEffect(() => {
    document.title = data
      ? `${data.first_name} ${data.last_name} — OfferTrail`
      : c.pageTitle;
  }, [c.pageTitle, data]);
  if (query.isLoading)
    return (
      <main className={classes.page}>
        <div className={classes.state}>
          <LoadingStatus>{c.detailLoading}</LoadingStatus>
        </div>
      </main>
    );
  if (query.isError || !data) {
    const status = relationshipErrorStatus(query.error);
    if (status === 401) return null;
    const forbidden = status === 403;
    const notFound = status === 404 || !query.isError;
    return (
      <main className={classes.page}>
        <Link className={classes.back} to={from}>
          ← {c.title}
        </Link>
        <div className={classes.state}>
          <h1>
            {forbidden
              ? copy.common.forbidden
              : notFound
                ? c.notFound
                : c.error}
          </h1>
          <p>
            {forbidden
              ? copy.common.forbiddenDescription
              : notFound
                ? c.notFoundDescription
                : c.emptyDescription}
          </p>
          {!forbidden && !notFound && (
            <ActionButton onClick={() => void query.refetch()}>
              {copy.common.retry}
            </ActionButton>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={classes.page}>
      {editing && (
        <ContactEditModal
          contact={{
            ...data,
            id: toLegacyContactId(data.id),
            organization_id:
              data.organization_id != null
                ? toLegacyOrganizationId(data.organization_id)
                : null,
          }}
          organizationName={data.organization?.name}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void query.refetch();
          }}
        />
      )}
      <DetailHeader
        backTo={from}
        backLabel={c.back}
        backState={{ restoreScrollY: navigationState?.scrollY }}
        eyebrow={c.eyebrow}
        title={`${data.first_name} ${data.last_name}`}
        subtitle={
          <>
            {data.role || c.noRole}
            {data.organization ? ` · ${data.organization.name}` : ''}
          </>
        }
        badges={
          <>
            {data.is_recruiter && <span>{copy.common.recruiter}</span>}
            {data.organization && (
              <span>
                {copy.types[
                  normalizeRelationshipKey(
                    data.organization.type,
                  ) as keyof typeof copy.types
                ] ?? data.organization.type}
              </span>
            )}
          </>
        }
        actions={
          <>
            <ActionButton variant="primary" onClick={() => setEditing(true)}>
              {copy.common.edit}
            </ActionButton>
            {data.email && (
              <a
                className={classes.contactAction}
                href={`mailto:${data.email}`}
              >
                {c.sendEmail}
              </a>
            )}
            {data.linkedin_url && (
              <ExternalAction href={data.linkedin_url}>
                LinkedIn ↗
              </ExternalAction>
            )}
          </>
        }
      />
      <DetailSummary
        label={c.summary}
        items={[
          {
            label: c.linkedOrganization,
            value: data.organization ? (
              <EntityLink
                to={`/app/etablissements/${data.organization.id}`}
                from={`${location.pathname}${location.search}`}
              >
                {data.organization.name}
              </EntityLink>
            ) : (
              c.noOrganization
            ),
          },
          { label: c.linkedApplications, value: data.applications.length },
          { label: c.updated, value: date(data.updated_at) },
        ]}
      />
      <Tabs
        label={c.content}
        value={tab}
        onChange={setTab}
        items={[
          ['overview', c.overview],
          [
            'applications',
            `${copy.common.applications} · ${data.applications.length}`,
          ],
          ['activity', `${copy.common.activity} · ${data.events.length}`],
        ]}
      >
        <section className={classes.content}>
          {tab === 'overview' && (
            <div className={classes.details}>
              <article>
                <span>{c.email}</span>
                {data.email ? (
                  <a href={`mailto:${data.email}`}>{data.email}</a>
                ) : (
                  <strong>{copy.common.missing}</strong>
                )}
              </article>
              <article>
                <span>{c.phone}</span>
                {data.phone ? (
                  <a href={`tel:${data.phone}`}>{data.phone}</a>
                ) : (
                  <strong>{copy.common.missing}</strong>
                )}
              </article>
              <article className={classes.notes}>
                <span>{c.notes}</span>
                <p>{data.notes || c.noNotes}</p>
              </article>
            </div>
          )}
          {tab === 'applications' &&
            (data.applications.length ? (
              <RelatedRecords label={c.linkedApplications}>
                {data.applications.map((item) => (
                  <RelatedRecord
                    key={item.id}
                    title={item.title}
                    detail={`${item.company} · ${date(item.applied_at)}`}
                    meta={
                      copy.status[item.status as keyof typeof copy.status] ??
                      item.status
                    }
                    onOpen={() =>
                      navigate(`/app/candidatures/${item.id}`, {
                        state: {
                          from: `${location.pathname}${location.search}`,
                          scrollY: window.scrollY,
                        },
                      })
                    }
                  />
                ))}
              </RelatedRecords>
            ) : (
              <Empty text={c.noApplications} />
            ))}
          {tab === 'activity' &&
            (data.events.length ? (
              <ol className={classes.timeline}>
                {data.events.map((event) => {
                  const kind = String(event.type || event.event_type);
                  return (
                    <li key={`${event.id}-${event.ts}`}>
                      <time>{date(event.ts)}</time>
                      <div>
                        <strong>
                          {copy.events[kind as keyof typeof copy.events] ??
                            kind.replaceAll('_', ' ')}
                        </strong>
                        {event.application && (
                          <EntityLink
                            to={`/app/candidatures/${event.application.id}`}
                            from={`${location.pathname}${location.search}`}
                          >
                            {event.application.title}
                          </EntityLink>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <Empty text={c.noActivity} />
            ))}
        </section>
      </Tabs>
    </main>
  );
};
function Empty({ text }: { text: string }) {
  return <div className={classes.empty}>{text}</div>;
}
