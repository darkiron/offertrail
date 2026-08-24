import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { organizationService } from '../services/api/organizations';
import type { Organization } from '../types';
import classes from './OrganizationMaintenancePage.module.scss';
import { ActionButton } from '@shared/ui/Action';
import {
  SearchField,
  SelectField,
  TextAreaField,
  TextField,
} from '@shared/ui/FormField';
import { LoadingStatus } from '@shared/ui/LoadingStatus';
import { useI18n } from '../i18n';
import {
  normalizeRelationshipKey,
  relationshipCopy,
} from '../features/relationships/locale';
import { useRelationshipAuthRedirect } from '../features/relationships/auth';

type Mode = 'merge' | 'split';
const TYPE_VALUES: Organization['type'][] = [
  'CLIENT_FINAL',
  'ESN',
  'CABINET_RECRUTEMENT',
  'STARTUP',
  'PME',
  'GRAND_COMPTE',
  'PORTAGE',
  'AUTRE',
];

function OrganizationPicker({
  label,
  organizations,
  value,
  exclude,
  onChange,
}: {
  label: string;
  organizations: Organization[];
  value: string;
  exclude?: string;
  onChange: (value: string) => void;
}) {
  const { locale } = useI18n();
  const c = relationshipCopy(locale).maintenance;
  const [search, setSearch] = useState('');
  const selected = organizations.find((item) => String(item.id) === value);
  const results = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(locale);
    if (!needle) return [];
    return organizations
      .filter(
        (item) =>
          String(item.id) !== exclude &&
          [item.name, item.city, item.website]
            .filter(Boolean)
            .some((field) =>
              String(field).toLocaleLowerCase(locale).includes(needle),
            ),
      )
      .slice(0, 6);
  }, [exclude, locale, organizations, search]);
  if (selected)
    return (
      <div className={classes.selection}>
        <small>{label}</small>
        <div>
          <span>
            <strong>{selected.name}</strong>
            <em>
              {selected.city || c.noLocation} ·{' '}
              {selected.total_applications ?? 0} {c.applications}
            </em>
          </span>
          <ActionButton
            variant="quiet"
            onClick={() => {
              onChange('');
              setSearch('');
            }}
          >
            {c.change}
          </ActionButton>
        </div>
      </div>
    );
  return (
    <div className={classes.picker}>
      <SearchField
        label={label}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={c.searchPlaceholder}
        autoComplete="off"
      />
      {search.trim() && (
        <div className={classes.results}>
          {results.length ? (
            results.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onChange(String(item.id));
                  setSearch('');
                }}
              >
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.city || c.noLocation}</small>
                </span>
                <em>
                  {item.total_applications ?? 0} {c.applications}
                </em>
              </button>
            ))
          ) : (
            <p>{c.noMatch}</p>
          )}
        </div>
      )}
    </div>
  );
}

export const OrganizationMaintenancePage = () => {
  const { locale } = useI18n();
  const copy = relationshipCopy(locale);
  const c = copy.maintenance;
  const redirectIfUnauthorized = useRelationshipAuthRedirect();
  const types: Array<[Organization['type'], string]> = TYPE_VALUES.map(
    (value) => [
      value,
      copy.types[normalizeRelationshipKey(value) as keyof typeof copy.types],
    ],
  );
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('merge');
  const [sourceId, setSourceId] = useState(params.get('source') ?? '');
  const [targetId, setTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [split, setSplit] = useState({
    name: '',
    type: 'AUTRE' as Organization['type'],
    website: '',
    notes: '',
  });

  useEffect(() => {
    document.title = c.pageTitle;
    organizationService
      .getAll()
      .then((items) =>
        setOrganizations(
          items.sort((a, b) => a.name.localeCompare(b.name, locale)),
        ),
      )
      .catch((caught) => {
        if (!redirectIfUnauthorized(caught)) setError(c.loadError);
      })
      .finally(() => setLoading(false));
  }, [c.loadError, c.pageTitle, locale, redirectIfUnauthorized]);
  const source = organizations.find((item) => String(item.id) === sourceId);
  const target = organizations.find((item) => String(item.id) === targetId);

  const merge = async () => {
    if (!source || !target) return;
    setSubmitting(true);
    setError(null);
    try {
      await organizationService.merge(source.id, target.id);
      navigate(`/app/etablissements/${target.id}`);
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(c.mergeError);
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };
  const createSplit = async () => {
    if (!source || !split.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await organizationService.split(source.id, {
        name: split.name.trim(),
        type: split.type,
        website: split.website || null,
        notes: split.notes || null,
        move_contacts: true,
      });
      navigate(`/app/etablissements/${created.id}`);
    } catch (caught) {
      if (redirectIfUnauthorized(caught)) return;
      setError(c.splitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={classes.page}>
      <Link className={classes.back} to="/app/etablissements">
        ← {c.back}
      </Link>
      <header className={classes.header}>
        <p className={classes.eyebrow}>{c.eyebrow}</p>
        <h1>{c.title}</h1>
        <p>{c.description}</p>
      </header>
      <nav className={classes.mode} aria-label={c.operationLabel}>
        <button
          type="button"
          className={mode === 'merge' ? classes.active : ''}
          onClick={() => {
            setMode('merge');
            setConfirming(false);
          }}
        >
          {c.mergeMode}
        </button>
        <button
          type="button"
          className={mode === 'split' ? classes.active : ''}
          onClick={() => {
            setMode('split');
            setConfirming(false);
          }}
        >
          {c.splitMode}
        </button>
      </nav>
      {error && (
        <p className={classes.error} role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className={classes.loading}>
          <LoadingStatus>{c.loading}</LoadingStatus>
        </div>
      ) : (
        <div className={classes.layout}>
          <section className={classes.workspace}>
            <div className={classes.fields}>
              <OrganizationPicker
                label={c.source}
                organizations={organizations}
                value={sourceId}
                onChange={(value) => {
                  setSourceId(value);
                  if (value === targetId) setTargetId('');
                  setConfirming(false);
                }}
              />
              {mode === 'merge' && (
                <OrganizationPicker
                  label={c.target}
                  organizations={organizations}
                  value={targetId}
                  exclude={sourceId}
                  onChange={(value) => {
                    setTargetId(value);
                    setConfirming(false);
                  }}
                />
              )}
            </div>
            {mode === 'merge' ? (
              <div className={classes.operation}>
                <div className={classes.transfer}>
                  <article>
                    <small>{c.deletedSource}</small>
                    <strong>{source?.name ?? c.select}</strong>
                    <span>
                      {source
                        ? `${source.total_applications ?? 0} ${c.applications}`
                        : c.chooseSource}
                    </span>
                  </article>
                  <b aria-hidden="true">→</b>
                  <article>
                    <small>{c.keptTarget}</small>
                    <strong>{target?.name ?? c.select}</strong>
                    <span>
                      {target
                        ? `${target.total_applications ?? 0} ${c.applications}`
                        : c.chooseTarget}
                    </span>
                  </article>
                </div>
                {!confirming ? (
                  <ActionButton
                    variant="primary"
                    disabled={!source || !target}
                    onClick={() => setConfirming(true)}
                  >
                    {c.verify}
                  </ActionButton>
                ) : (
                  <div className={classes.confirm}>
                    <p>
                      <strong>{c.irreversible}</strong> {c.confirmPrefix} «{' '}
                      {source?.name} » {c.confirmMiddle} « {target?.name} »,{' '}
                      {c.confirmSuffix}
                    </p>
                    <div>
                      <ActionButton onClick={() => setConfirming(false)}>
                        {c.backAction}
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        disabled={submitting}
                        onClick={() => void merge()}
                      >
                        {submitting ? c.merging : c.confirmMerge}
                      </ActionButton>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={classes.operation}>
                <div className={classes.splitForm}>
                  <TextField
                    label={c.newName}
                    value={split.name}
                    onChange={(event) =>
                      setSplit((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder={c.newNamePlaceholder}
                  />
                  <SelectField
                    label={c.type}
                    value={split.type}
                    onChange={(event) =>
                      setSplit((current) => ({
                        ...current,
                        type: event.target.value as Organization['type'],
                      }))
                    }
                    options={types}
                  />
                  <TextField
                    label={c.website}
                    type="url"
                    value={split.website}
                    onChange={(event) =>
                      setSplit((current) => ({
                        ...current,
                        website: event.target.value,
                      }))
                    }
                    placeholder={copy.forms.urlPlaceholder}
                  />
                  <TextAreaField
                    className={classes.notes}
                    label={c.context}
                    rows={4}
                    value={split.notes}
                    onChange={(event) =>
                      setSplit((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder={c.contextPlaceholder}
                  />
                </div>
                <p className={classes.notice}>{c.splitNotice}</p>
                <ActionButton
                  variant="primary"
                  disabled={!source || !split.name.trim() || submitting}
                  onClick={() => void createSplit()}
                >
                  {submitting ? c.splitting : c.createSplit}
                </ActionButton>
              </div>
            )}
          </section>
          <aside>
            <h2>{c.before}</h2>
            <dl>
              <div>
                <dt>{c.merge}</dt>
                <dd>{c.mergeHelp}</dd>
              </div>
              <div>
                <dt>{c.split}</dt>
                <dd>{c.splitHelp}</dd>
              </div>
              <div>
                <dt>{c.check}</dt>
                <dd>{c.checkHelp}</dd>
              </div>
            </dl>
            {source && (
              <Link to={`/app/etablissements/${source.id}`}>
                {c.openSource}
              </Link>
            )}
          </aside>
        </div>
      )}
    </main>
  );
};
