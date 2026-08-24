import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useOrganizationWorkspace } from '../features/relationships/queries';
import classes from './CompanyDetailsPage.module.scss';
import { ActionButton, ActionLink, ExternalAction } from '@shared/ui/Action';
import { LoadingStatus } from '@shared/ui/LoadingStatus';
import { DetailSummary } from '@shared/ui/DetailSummary';
import { RelatedRecord, RelatedRecords } from '@shared/ui/RelatedRecords';
import { Tabs } from '@shared/ui/Tabs';
import { DetailHeader } from '@shared/ui/DetailHeader';
import { WorkflowOrganizationEditModal } from '@widgets/organizations/WorkflowOrganizationEditModal';
import { EntityLink } from '@shared/ui/EntityLink';
import { useI18n } from '../i18n';
import {
  formatRelationshipDate,
  normalizeRelationshipKey,
  relationshipErrorStatus,
  relationshipCopy,
} from '../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../features/relationships/auth';

type Tab = 'applications' | 'contacts' | 'activity';
export const CompanyDetailsPage = () => {
  const { locale } = useI18n();
  const copy = relationshipCopy(locale);
  const c = copy.organizations;
  const date = (value: string | null) =>
    formatRelationshipDate(value, locale, copy.common.missing);
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('applications');
  const [editing, setEditing] = useState(false);
  const navigationState = location.state as {
    from?: string;
    scrollY?: number;
  } | null;
  const from = navigationState?.from ?? '/app/etablissements';
  const query = useOrganizationWorkspace(id);
  const data = query.data;
  useRelationshipAuthRedirect(query.error);

  useEffect(() => {
    if (data) document.title = `${data.organization.name} — OfferTrail`;
  }, [data]);
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
                : c.emptyFilteredDescription}
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

  const { organization } = data;
  return (
    <main className={classes.page}>
      <DetailHeader
        backTo={from}
        backLabel={c.back}
        backState={{ restoreScrollY: navigationState?.scrollY }}
        eyebrow={c.relationEyebrow}
        title={organization.name}
        subtitle={`${c.followedSince} ${date(organization.created_at)}`}
        badges={
          <span>
            {copy.types[
              normalizeRelationshipKey(
                organization.type,
              ) as keyof typeof copy.types
            ] ?? organization.type}
          </span>
        }
        actions={
          <>
            {organization.website && (
              <ExternalAction href={organization.website}>
                {c.visit}
              </ExternalAction>
            )}
            <ActionButton variant="primary" onClick={() => setEditing(true)}>
              {copy.common.edit}
            </ActionButton>
            <ActionLink
              to={`/app/etablissements/maintenance?source=${organization.id}`}
            >
              {c.duplicates}
            </ActionLink>
          </>
        }
      />
      <DetailSummary
        label={c.summary}
        items={[
          {
            label: copy.common.applications,
            value: organization.applications_count,
            detail: c.historyLinked,
          },
          {
            label: c.responses,
            value: organization.responses_count,
            detail: `${organization.response_rate}% ${c.ofApplications}`,
          },
          {
            label: c.positive,
            value: organization.positive_count,
            detail: c.positiveDetail,
          },
          {
            label: c.lastActivity,
            value: date(organization.updated_at),
            detail: c.trackingDetail,
          },
        ]}
      />
      {organization.description && (
        <section className={classes.context}>
          <span>{c.context}</span>
          <p>{organization.description}</p>
        </section>
      )}
      <Tabs
        label={c.content}
        value={tab}
        onChange={setTab}
        items={[
          [
            'applications',
            `${copy.common.applications} · ${data.applications.length}`,
          ],
          ['contacts', `${copy.common.contacts} · ${data.contacts.length}`],
          ['activity', `${copy.common.activity} · ${data.activity.length}`],
        ]}
      >
        <section className={classes.content}>
          {tab === 'applications' &&
            (data.applications.length ? (
              <RelatedRecords label={c.linkedApplications}>
                {data.applications.map((application) => (
                  <RelatedRecord
                    key={application.id}
                    title={application.title}
                    detail={`${application.source || c.sourceMissing} · ${date(application.applied_at)}`}
                    meta={
                      copy.status[
                        application.status as keyof typeof copy.status
                      ] ?? application.status
                    }
                    onOpen={() =>
                      navigate(`/app/candidatures/${application.id}`, {
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
              <Empty
                title={c.noApplications}
                text={c.noApplicationsDescription}
              />
            ))}
          {tab === 'contacts' &&
            (data.contacts.length ? (
              <RelatedRecords label={c.linkedContacts}>
                {data.contacts.map((contact) => (
                  <RelatedRecord
                    key={contact.id}
                    title={`${contact.first_name} ${contact.last_name}`}
                    detail={contact.email || copy.contacts.noEmail}
                    meta={contact.role || copy.contacts.noRole}
                    onOpen={() =>
                      navigate(`/app/contacts/${contact.id}`, {
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
              <Empty title={c.noContacts} text={c.noContactsDescription} />
            ))}
          {tab === 'activity' &&
            (data.activity.length ? (
              <ol className={classes.timeline}>
                {data.activity.map((item) => (
                  <li key={item.id}>
                    <time>{date(item.created_at)}</time>
                    <div>
                      <strong>
                        {copy.events[item.type as keyof typeof copy.events] ??
                          item.type.replaceAll('_', ' ')}
                      </strong>
                      {item.content && <p>{item.content}</p>}
                      <EntityLink
                        to={`/app/candidatures/${item.application_id}`}
                        from={`${location.pathname}${location.search}`}
                      >
                        {c.openApplication}
                      </EntityLink>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty title={c.noActivity} text={c.noActivityDescription} />
            ))}
        </section>
      </Tabs>
      {editing && (
        <WorkflowOrganizationEditModal
          organization={organization}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void query.refetch();
          }}
        />
      )}
    </main>
  );
};
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className={classes.empty}>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
