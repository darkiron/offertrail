import type { KeyboardEvent, ReactNode } from 'react';
import classes from './RelatedRecords.module.scss';

export function RelatedRecords({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className={classes.list} role="list" aria-label={label}>
      {children}
    </div>
  );
}
export function RelatedRecord({
  title,
  detail,
  meta,
  onOpen,
}: {
  title: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  onOpen: () => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <article
      className={classes.row}
      role="listitem"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div>
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
      {meta && <div className={classes.meta}>{meta}</div>}
      <span className={classes.arrow} aria-hidden="true">
        →
      </span>
    </article>
  );
}
