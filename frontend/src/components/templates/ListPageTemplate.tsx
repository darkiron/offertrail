import React from 'react';

interface ListPageTemplateProps {
  title: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  content: React.ReactNode;
  pagination?: React.ReactNode;
  isLoading?: boolean;
}

export const ListPageTemplate: React.FC<ListPageTemplateProps> = ({
  title,
  actions,
  filters,
  content,
  pagination,
  isLoading,
}) => {
  return (
    <div className="section">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title">{title}</h1>
          </div>
          {actions && (
            <div className="level-right">
              {actions}
            </div>
          )}
        </div>

        {filters && (
          <div className="box mb-5">
            {filters}
          </div>
        )}

        <div className={`is-relative ${isLoading ? 'is-loading-container' : ''}`}>
          {content}
          {pagination && <div className="mt-5">{pagination}</div>}
        </div>
      </div>
    </div>
  );
};
