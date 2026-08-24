import type{ReactNode}from'react';import classes from './StatePanel.module.scss';
export function StatePanel({title,description,children}:{title?:string;description?:string;children?:ReactNode}){return <div className={classes.state}>{title&&<h2>{title}</h2>}{description&&<p>{description}</p>}{children}</div>}
