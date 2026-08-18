import type { KeyboardEvent, ReactNode } from 'react';
import classes from './EntityList.module.css';

export function EntityList({ label, headings, children }: { label: string; headings: [string, string, string, string]; children: ReactNode }) {
  return <div className={classes.list} role="table" aria-label={label}><div className={classes.header} role="row">{headings.map((heading) => <span role="columnheader" key={heading}>{heading}</span>)}<span aria-hidden="true" /></div>{children}</div>;
}
export function EntityListRow({ onOpen, children, busy=false }: { onOpen:()=>void; children:ReactNode; busy?:boolean }) {
  const key=(event:KeyboardEvent<HTMLElement>)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen();}};
  return <article className={classes.row} role="row" tabIndex={0} aria-busy={busy} onClick={onOpen} onKeyDown={key}>{children}<span className={classes.arrow} aria-hidden="true">→</span></article>;
}
export function EntityIdentity({ title, detail }: { title: ReactNode; detail?: ReactNode }) { return <div className={classes.identity} role="cell"><strong>{title}</strong>{detail && <span>{detail}</span>}</div>; }
export function EntityValue({ value, detail, tone = 'default' }: { value: ReactNode; detail?: ReactNode; tone?: 'default' | 'danger' | 'muted' }) { return <div className={classes.value} data-tone={tone} role="cell"><strong>{value}</strong>{detail && <span>{detail}</span>}</div>; }
export function ResultHeader({ children, action }: { children:ReactNode; action?:ReactNode }) { return <div className={classes.resultHeader}><h2>{children}</h2>{action}</div>; }
