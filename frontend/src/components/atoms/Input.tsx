import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: string;
  iconRight?: string;
  controlClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  iconLeft,
  iconRight,
  controlClassName = '',
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="field">
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <div className={`control ${iconLeft ? 'has-icons-left' : ''} ${iconRight ? 'has-icons-right' : ''} ${controlClassName}`}>
        <input 
          id={id}
          className={`input ${error ? 'is-danger' : ''} ${className}`} 
          {...props} 
        />
        {iconLeft && (
          <span className="icon is-small is-left">
            <i className={`fas ${iconLeft}`}></i>
          </span>
        )}
        {iconRight && (
          <span className="icon is-small is-right">
            <i className={`fas ${iconRight}`}></i>
          </span>
        )}
      </div>
      {error && <p className="help is-danger">{error}</p>}
    </div>
  );
};
