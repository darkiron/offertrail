import type { HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Dialog } from '../molecules/Dialog';

const block = (className = '') => `ot-ui-block ${className}`.trim();

export function UiModal({ opened, onClose, title, children }: { opened: boolean; onClose: () => void; title: ReactNode; size?: string; children: ReactNode }) {
  if (!opened) return null;
  return <Dialog title={title} onClose={onClose}>{children}</Dialog>;
}

export function UiText({ children, className = '', ...props }: any) {
  return <span className={block(className)} {...props}>{children}</span>;
}

export function UiStack({ children, className = '', ...props }: any) {
  return <div className={block(`ot-stack ${className}`)} {...props}>{children}</div>;
}

export function UiGroup({ children, className = '', ...props }: any) {
  return <div className={block(`ot-group ${className}`)} {...props}>{children}</div>;
}

export function UiGrid({ children, className = '', ...props }: any) {
  return <div className={block(`ot-ui-grid ${className}`)} {...props}>{children}</div>;
}

export function UiField({ label, children, ...props }: { label?: string; children: ReactNode } & HTMLAttributes<HTMLLabelElement>) {
  return <label className="ot-field" {...props}>{label && <span>{label}</span>}{children}</label>;
}

export function UiTextInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <UiField label={label}><input {...props} className={`ot-control ${props.className ?? ''}`} /></UiField>;
}

export function UiNumberInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return <UiTextInput {...props} label={label} type="number" />;
}

export function UiTextarea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return <UiField label={label}><textarea {...props} className={`ot-control ot-area ${props.className ?? ''}`} /></UiField>;
}

export function UiSelect({ label, data = [], ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; data?: readonly { value: string; label: string }[] }) {
  return <UiField label={label}><select {...props} className={`ot-control ${props.className ?? ''}`}>{data.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></UiField>;
}

export function UiBadge({ children }: { children: ReactNode }) { return <span className="ot-badge">{children}</span>; }
export function UiPaper({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={block(`ot-paper ${className}`)} {...props}>{children}</div>; }
export function UiCenter({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className="ot-center" {...props}>{children}</div>; }
export function UiLoader() { return <span className="ot-loader" role="status" aria-label="Chargement" />; }

export function UiAutocomplete({ label, value, onChange, data = [], onOptionSubmit, placeholder }: { label?: string; value: string; onChange: (value: string) => void; data?: string[]; onOptionSubmit?: (value: string) => void; placeholder?: string }) {
  const id = `ot-options-${label ?? 'field'}`.replace(/\W/g, '-');
  return <UiField label={label}><input list={id} value={value} placeholder={placeholder} autoComplete="off" className="ot-control" onChange={event => { onChange(event.target.value); if (data.includes(event.target.value)) onOptionSubmit?.(event.target.value); }} /><datalist id={id}>{data.map(item => <option key={item} value={item} />)}</datalist></UiField>;
}
