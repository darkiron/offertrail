import { useId } from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Dialog } from '../molecules/Dialog';
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

export function UiModal({
  opened,
  onClose,
  title,
  children,
}: {
  opened: boolean;
  onClose: () => void;
  title: ReactNode;
  size?: string;
  children: ReactNode;
}) {
  return opened ? (
    <Dialog title={title} onClose={onClose}>
      {children}
    </Dialog>
  ) : null;
}

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

export function UiField({
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
export function UiNumberInput({
  label,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label?: string;
  onChange?: (value: string | number) => void;
}) {
  return (
    <UiField label={label}>
      <input
        {...props}
        type="number"
        className={`${classes.control} ${props.className ?? ''}`}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </UiField>
  );
}
export function UiTextarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <UiField label={label}>
      <textarea
        {...props}
        className={`${classes.control} ${classes.area} ${props.className ?? ''}`}
      />
    </UiField>
  );
}
export function UiSelect({
  label,
  data = [],
  onChange,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label?: string;
  data?: readonly { value: string; label: string }[];
  onChange?: (value: string | null) => void;
}) {
  return (
    <UiField label={label}>
      <select
        {...props}
        className={`${classes.control} ${props.className ?? ''}`}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {data.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
export function UiCenter({
  h,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { h?: number | string }) {
  return (
    <div
      {...props}
      className={`${classes.center} ${props.className ?? ''}`}
      style={{ minHeight: h, ...style }}
    />
  );
}
export function UiLoader({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={classes.loader}
      data-size={size}
      role="status"
      aria-label="Chargement"
    />
  );
}

export function UiAutocomplete({
  label,
  value,
  onChange,
  data = [],
  onOptionSubmit,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  data?: string[];
  onOptionSubmit?: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <UiField label={label}>
      <input
        list={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        className={classes.control}
        onChange={(event) => {
          onChange(event.target.value);
          if (data.includes(event.target.value))
            onOptionSubmit?.(event.target.value);
        }}
      />
      <datalist id={id}>
        {data.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </UiField>
  );
}
