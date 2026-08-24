import type { ReactNode } from 'react';
import classes from './DetailSummary.module.scss';

export function DetailSummary({ items, label = 'Synthèse' }: { items: Array<{ label: string; value: ReactNode; detail?: ReactNode }>; label?: string }) {
  return <section className={classes.summary} aria-label={label}>{items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong>{item.detail && <small>{item.detail}</small>}</div>)}</section>;
}
