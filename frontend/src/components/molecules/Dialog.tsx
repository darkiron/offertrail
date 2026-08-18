import type { ReactNode } from 'react';
import classes from './Dialog.module.css';

export function Dialog({ eyebrow, title, onClose, children }: { eyebrow?: string; title: string; onClose: () => void; children: ReactNode }) {
  return <div className={classes.backdrop} role="presentation" onMouseDown={(event) => { if(event.target===event.currentTarget)onClose(); }}><section className={classes.dialog} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header className={classes.header}><div>{eyebrow&&<p className={classes.eyebrow}>{eyebrow}</p>}<h2 className={classes.title} id="dialog-title">{title}</h2></div><button className={classes.close} type="button" aria-label="Fermer" onClick={onClose}>×</button></header><div className={classes.body}>{children}</div></section></div>;
}
