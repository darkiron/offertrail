import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import classes from './EntityList.module.scss';

export function EntityList({
  label,
  headings,
  children,
}: {
  label: string;
  headings: [string, string, string, string];
  children: ReactNode;
}) {
  return (
    <div className={classes.list} role="table" aria-label={label}>
      <div className={classes.header} role="row">
        {headings.map((heading) => (
          <span role="columnheader" key={heading}>
            {heading}
          </span>
        ))}
        <span role="columnheader" aria-hidden="true" />
      </div>
      <div role="rowgroup">{children}</div>
    </div>
  );
}
export function EntityListRow({
  onOpen,
  children,
  busy = false,
}: {
  onOpen: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={classes.row} role="row" aria-busy={busy}>
      {children}
      <div role="cell" className={classes.action}>
        <button
          className={classes.arrow}
          type="button"
          aria-label={t('common.details')}
          disabled={busy}
          onClick={onOpen}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
export function EntityIdentity({
  title,
  detail,
}: {
  title: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className={classes.identity} role="cell">
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
export function EntityValue({
  value,
  detail,
  tone = 'default',
}: {
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'danger' | 'muted';
}) {
  return (
    <div className={classes.value} data-tone={tone} role="cell">
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
export function ResultHeader({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={classes.resultHeader}>
      <h2>{children}</h2>
      {action}
    </div>
  );
}
