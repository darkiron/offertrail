import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, footer, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <header className="card-header">
          <p className="card-header-title">{title}</p>
        </header>
      )}
      <div className="card-content">
        <div className="content">
          {children}
        </div>
      </div>
      {footer && (
        <footer className="card-footer">
          {footer}
        </footer>
      )}
    </div>
  );
};
