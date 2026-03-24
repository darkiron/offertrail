import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  isFullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  isFullWidth,
  className = '',
  ...props
}) => {
  return (
    <div className="field">
      {label && <label className="label">{label}</label>}
      <div className={`control ${isFullWidth ? 'is-expanded' : ''}`}>
        <div className={`select ${isFullWidth ? 'is-fullwidth' : ''} ${error ? 'is-danger' : ''} ${className}`}>
          <select {...props}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="help is-danger">{error}</p>}
    </div>
  );
};
