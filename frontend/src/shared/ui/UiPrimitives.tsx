import type {
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';
import classes from './UiPrimitives.module.scss';

type Space = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
type ResponsiveColumns = number | { base?: number; sm?: number; md?: number };
type PrimitiveStyle = CSSProperties &
  Record<`--ui-${string}`, string | number | undefined>;
const space = (value?: Space) =>
  typeof value === 'number'
    ? `${value}px`
    : value
      ? `var(--ot-space-${({ xs: 1, sm: 2, md: 4, lg: 6, xl: 8 } as const)[value]})`
      : undefined;
const mergeStyle = (
  style: CSSProperties | undefined,
  custom: PrimitiveStyle,
): CSSProperties => ({ ...custom, ...style });

interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fw?: number;
  tt?: 'uppercase';
  ls?: string;
  c?: string;
  fs?: 'italic';
  ta?: CSSProperties['textAlign'];
  ff?: 'monospace';
  mt?: Space;
  mb?: Space;
}
export function UiText({
  className = '',
  size,
  fw,
  tt,
  ls,
  c,
  fs,
  ta,
  ff,
  mt,
  mb,
  style,
  ...props
}: TextProps) {
  const custom: PrimitiveStyle = {
    '--ui-size': size ? `var(--ot-font-size-${size}, inherit)` : undefined,
    '--ui-weight': fw,
    '--ui-color':
      c === 'dimmed'
        ? 'var(--ot-muted)'
        : c === 'red'
          ? 'var(--ot-danger)'
          : undefined,
    '--ui-mt': space(mt),
    '--ui-mb': space(mb),
    letterSpacing: ls,
    textAlign: ta,
    textTransform: tt,
    fontStyle: fs,
    fontFamily: ff === 'monospace' ? 'monospace' : undefined,
  };
  return (
    <span
      {...props}
      className={`${classes.text} ${className}`}
      style={mergeStyle(style, custom)}
    />
  );
}

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Space;
  p?: Space;
  mt?: Space;
  mb?: Space;
}
export function UiStack({
  className = '',
  gap = 'md',
  p,
  mt,
  mb,
  style,
  ...props
}: LayoutProps) {
  return (
    <div
      {...props}
      className={`${classes.stack} ${className}`}
      style={mergeStyle(style, {
        '--ui-gap': space(gap),
        '--ui-p': space(p),
        '--ui-mt': space(mt),
        '--ui-mb': space(mb),
      })}
    />
  );
}
export function UiGroup({
  className = '',
  gap = 'sm',
  p,
  mt,
  mb,
  style,
  justify,
  wrap,
  ...props
}: LayoutProps & {
  justify?: CSSProperties['justifyContent'];
  wrap?: CSSProperties['flexWrap'];
}) {
  return (
    <div
      {...props}
      className={`${classes.group} ${className}`}
      style={mergeStyle(style, {
        '--ui-gap': space(gap),
        '--ui-p': space(p),
        '--ui-mt': space(mt),
        '--ui-mb': space(mb),
        justifyContent: justify,
        flexWrap: wrap,
      })}
    />
  );
}
export function UiGrid({
  className = '',
  cols = 1,
  spacing = 'md',
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  cols?: ResponsiveColumns;
  spacing?: Space;
}) {
  const responsive = typeof cols === 'number' ? { base: cols } : cols;
  return (
    <div
      {...props}
      className={`${classes.grid} ${className}`}
      style={mergeStyle(style, {
        '--ui-cols': responsive.base ?? 1,
        '--ui-cols-sm': responsive.sm ?? responsive.base ?? 1,
        '--ui-cols-md': responsive.md ?? responsive.sm ?? responsive.base ?? 1,
        '--ui-gap': space(spacing),
      })}
    />
  );
}

function UiField({
  label,
  children,
  ...props
}: { label?: string; children: ReactNode } & HTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className={`${classes.field} ${props.className ?? ''}`}>
      {label && <span>{label}</span>}
      {children}
    </label>
  );
}
export function UiTextInput({
  label,
  leftSection,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leftSection?: ReactNode;
}) {
  return (
    <UiField label={label}>
      {leftSection}
      <input
        {...props}
        className={`${classes.control} ${props.className ?? ''}`}
      />
    </UiField>
  );
}
export function UiBadge({
  children,
  color,
  size,
  variant: _variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  color?: string;
  size?: 'xs' | 'sm';
  variant?: string;
}) {
  return (
    <span
      {...props}
      className={`${classes.badge} ${props.className ?? ''}`}
      data-color={color}
      data-size={size}
      data-variant={_variant}
    >
      {children}
    </span>
  );
}
export function UiPaper({
  className = '',
  p,
  padding,
  radius,
  withBorder,
  style,
  ...props
}: LayoutProps & { padding?: Space; radius?: string; withBorder?: boolean }) {
  return (
    <div
      {...props}
      className={`${classes.paper} ${className}`}
      data-border={withBorder || undefined}
      data-radius={radius}
      style={mergeStyle(style, { '--ui-p': space(p ?? padding) })}
    />
  );
}
