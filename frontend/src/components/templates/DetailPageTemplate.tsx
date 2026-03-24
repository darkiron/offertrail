import React from 'react';

interface DetailPageTemplateProps {
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  content: React.ReactNode;
}

export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  header,
  sidebar,
  content,
}) => {
  return (
    <div className="section">
      <div className="container">
        <div className="mb-6">
          {header}
        </div>
        
        <div className="columns">
          <div className={`column ${sidebar ? 'is-8' : 'is-12'}`}>
            {content}
          </div>
          {sidebar && (
            <div className="column is-4">
              {sidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
