import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import classes from './Action.module.css';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
const style = (variant: Variant, className?: string) => `${classes.action} ${classes[variant]} ${className ?? ''}`;

export function ActionButton({ variant = 'secondary', className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} type={type} className={style(variant, className)} />;
}

export function ActionLink({ to, children, variant = 'secondary', className, disabled = false, onClick }: { to: string; children: ReactNode; variant?: Variant; className?: string; disabled?: boolean; onClick?: () => void }) {
  return <Link to={to} className={`${style(variant, className)} ${disabled ? classes.disabled : ''}`} aria-disabled={disabled || undefined} onClick={disabled ? (event) => event.preventDefault() : onClick}>{children}</Link>;
}

export function ExternalAction({ href, children, variant = 'secondary', className }: { href: string; children: ReactNode; variant?: Variant; className?: string }) {
  return <a href={href} className={style(variant, className)} target="_blank" rel="noreferrer">{children}</a>;
}
