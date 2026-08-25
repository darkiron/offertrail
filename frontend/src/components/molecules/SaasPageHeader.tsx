import type { ReactNode } from 'react';
import classes from './SaasPageHeader.module.css';
export function SaasPageHeader({eyebrow,title,description,actions}:{eyebrow:string;title:string;description?:string;actions?:ReactNode}){return <header className={classes.header}><div><p className={classes.eyebrow}>{eyebrow}</p><h1 className={classes.title}>{title}</h1>{description&&<p className={classes.description}>{description}</p>}</div>{actions&&<div className={classes.actions}>{actions}</div>}</header>}
