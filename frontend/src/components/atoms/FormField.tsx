import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import classes from './FormField.module.css';

type Option = readonly [value: string, label: string];

export function SearchField({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className={`${classes.field} ${className ?? ''}`}><span className={classes.label}>{label}</span><input {...props} className={classes.control} type="search" />{hint && <small className={classes.hint}>{hint}</small>}</label>;
}

export function TextField({ label, hint, className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className={`${classes.field} ${className ?? ''}`}><span className={classes.label}>{label}</span><input {...props} className={classes.control} type={type} />{hint && <small className={classes.hint}>{hint}</small>}</label>;
}

export function SelectField({ label, hint, options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; options: readonly Option[] }) {
  return <label className={`${classes.field} ${className ?? ''}`}><span className={classes.label}>{label}</span><select {...props} className={classes.control}>{options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}</select>{hint && <small className={classes.hint}>{hint}</small>}</label>;
}

export function TextAreaField({ label, hint, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return <label className={`${classes.field} ${className ?? ''}`}><span className={classes.label}>{label}</span><textarea {...props} className={`${classes.control} ${classes.area}`} />{hint && <small className={classes.hint}>{hint}</small>}</label>;
}
