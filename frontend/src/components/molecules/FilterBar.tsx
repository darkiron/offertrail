import type { CSSProperties,ReactNode } from 'react';import classes from './FilterBar.module.css';
export function FilterBar({label,columns='1fr',children}:{label:string;columns?:string;children:ReactNode}){return <section className={classes.bar} style={{'--filter-columns':columns} as CSSProperties} aria-label={label}>{children}</section>}
