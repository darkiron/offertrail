import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, type ButtonVariant } from './Button';
import classes from './Action.module.scss';

type Variant = Exclude<ButtonVariant, 'ghost'>;
const style = (variant: Variant, className?: string) =>
  `${classes.action} ${classes[variant]} ${className ?? ''}`;

export function ActionButton({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <Button {...props} type={type} variant={variant} className={className} />
  );
}

export function ActionLink({
  to,
  children,
  variant = 'secondary',
  className,
  disabled = false,
  onClick,
}: {
  to: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      to={to}
      className={`${style(variant, className)} ${disabled ? classes.disabled : ''}`}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (event) => event.preventDefault() : onClick}
    >
      {children}
    </Link>
  );
}

export function ExternalAction({
  href,
  children,
  variant = 'secondary',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={style(variant, className)}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}
