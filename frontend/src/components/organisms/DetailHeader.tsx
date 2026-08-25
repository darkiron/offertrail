import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import classes from './DetailHeader.module.css';

export function DetailHeader({ backTo, backLabel, eyebrow, title, subtitle, badges, actions, backState }: {
  backTo: string; backLabel: string; eyebrow: string; title: string; subtitle?: ReactNode;
  badges?: ReactNode; actions?: ReactNode; backState?: unknown;
}) {
  return <>
    <Link className={classes.back} to={backTo} state={backState}>← {backLabel}</Link>
    <header className={classes.hero}>
      <div><p className={classes.eyebrow}>{eyebrow}</p><h1>{title}</h1>{subtitle && <p className={classes.subtitle}>{subtitle}</p>}{badges && <div className={classes.badges}>{badges}</div>}</div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </header>
  </>;
}
