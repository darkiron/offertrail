import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import classes from './EntityLink.module.scss';

export function EntityLink({to,children,from,scrollY}:{to:string;children:ReactNode;from:string;scrollY?:number}){
  const currentScroll = scrollY ?? (typeof window === 'undefined' ? 0 : window.scrollY);
  return <Link className={classes.link} to={to} state={{from,scrollY:currentScroll}}>{children}<span aria-hidden="true">→</span></Link>;
}
