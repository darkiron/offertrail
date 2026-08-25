import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import classes from './EntitySearchField.module.scss';

export interface EntitySearchOption {
  id: number | string;
  label: string;
  detail?: string;
}

interface EntitySearchFieldProps {
  label: string;
  hint?: string;
  value: EntitySearchOption | null;
  onSearch: (query: string) => Promise<EntitySearchOption[]>;
  onSelect: (option: EntitySearchOption) => void;
  onClear: () => void;
  onCreate?: (name: string) => Promise<EntitySearchOption>;
  createLabel?: (name: string) => string;
  placeholder?: string;
}

export function EntitySearchField({
  label,
  hint,
  value,
  onSearch,
  onSelect,
  onClear,
  onCreate,
  createLabel,
  placeholder,
}: EntitySearchFieldProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState(value?.label ?? '');
  const [results, setResults] = useState<EntitySearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  useEffect(() => setQuery(value?.label ?? ''), [value]);
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2 || term === value?.label) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await onSearch(term);
        if (active)
          setResults(
            items
              .filter((item) => String(item.id) !== String(value?.id))
              .slice(0, 8),
          );
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, onSearch, query, value]);
  const create = async () => {
    const name = query.trim();
    if (!onCreate || name.length < 2) return;
    setCreating(true);
    setError('');
    try {
      const option = await onCreate(name);
      onSelect(option);
      setQuery(option.label);
      setOpen(false);
      setResults([]);
    } catch {
      setError(t('common.entitySearch.createError'));
    } finally {
      setCreating(false);
    }
  };
  const hasExactMatch = results.some(
    (option) =>
      option.label.trim().toLocaleLowerCase() ===
      query.trim().toLocaleLowerCase(),
  );
  return (
    <div className={classes.field}>
      <label>
        <span>{label}</span>
        <div className={classes.control}>
          <input
            value={query}
            placeholder={placeholder ?? t('common.entitySearch.placeholder')}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setError('');
              if (value) onClear();
            }}
          />
          {(value || query) && (
            <button
              type="button"
              aria-label={t('common.entitySearch.clear')}
              onClick={() => {
                setQuery('');
                setResults([]);
                setError('');
                onClear();
              }}
            >
              ×
            </button>
          )}
        </div>
      </label>
      {hint && <small>{hint}</small>}
      {error && <small className={classes.error}>{error}</small>}
      {open && query.trim().length >= 2 && query !== value?.label && (
        <div className={classes.results} role="listbox">
          {loading ? (
            <span className={classes.state} role="status">
              {t('common.entitySearch.loading')}
            </span>
          ) : (
            <>
              {results.map((option) => (
                <button
                  type="button"
                  role="option"
                  key={option.id}
                  onClick={() => {
                    onSelect(option);
                    setQuery(option.label);
                    setOpen(false);
                    setResults([]);
                  }}
                >
                  <strong>{option.label}</strong>
                  {option.detail && <span>{option.detail}</span>}
                </button>
              ))}
              {!results.length && !onCreate && (
                <span className={classes.state}>
                  {t('common.entitySearch.empty')}
                </span>
              )}
              {onCreate && !hasExactMatch && (
                <button
                  className={classes.create}
                  type="button"
                  onClick={create}
                  disabled={creating}
                >
                  <strong>
                    {creating
                      ? t('common.entitySearch.creating')
                      : (createLabel?.(query.trim()) ??
                        t('common.entitySearch.create').replace(
                          '{{name}}',
                          query.trim(),
                        ))}
                  </strong>
                  <span>{t('common.entitySearch.createHint')}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
