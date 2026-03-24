import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { type ApplicationModel, mapApplicationDtoToModel } from '../domain/application/model';
import { type CompanyModel, mapCompanyDtoToModel } from '../domain/company/model';
import { DetailPageTemplate } from '../components/templates/DetailPageTemplate';
import { StatusBadge } from '../components/molecules/StatusBadge';
import { Card } from '../components/atoms/Card';

interface ApplicationDetailsPageProps {
  id: number;
}

export const ApplicationDetailsPage: React.FC<ApplicationDetailsPageProps> = ({ id }) => {
  const [application, setApplication] = useState<ApplicationModel | null>(null);
  const [company, setCompany] = useState<CompanyModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.getApplication(id);
        setApplication(mapApplicationDtoToModel(response.application));
        setCompany(mapCompanyDtoToModel(response.company));
      } catch (error) {
        console.error('Error fetching application details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div className="section">Loading...</div>;
  if (!application) return <div className="section">Application not found.</div>;

  const header = (
    <div className="level">
      <div className="level-left">
        <div>
          <h1 className="title mb-1">{application.title}</h1>
          <p className="subtitle is-5 has-text-grey">{application.company.name}</p>
        </div>
      </div>
      <div className="level-right">
        <StatusBadge status={application.status} />
      </div>
    </div>
  );

  const sidebar = company ? (
    <Card title="Company Details">
      <p><strong>Type:</strong> {company.type}</p>
      <p><strong>Website:</strong> {company.website || '-'}</p>
      <p><strong>Location:</strong> {company.location || '-'}</p>
      <hr />
      <div className="level is-mobile">
        <div className="level-item has-text-centered">
          <div>
            <p className="heading">Apps</p>
            <p className="title is-6">{company.metrics.totalApplications}</p>
          </div>
        </div>
        <div className="level-item has-text-centered">
          <div>
            <p className="heading">Resp.</p>
            <p className="title is-6">{company.metrics.responseRate}%</p>
          </div>
        </div>
      </div>
      <a href={`#/companies/${company.id}`} className="button is-fullwidth is-link is-light mt-3">View Details</a>
    </Card>
  ) : null;

  const content = (
    <div>
      <Card title="Notes" className="mb-5">
        <p>{application.jobUrl ? <a href={application.jobUrl} target="_blank">Job URL</a> : 'No URL provided'}</p>
        <hr />
        {/* Render timeline or more details */}
      </Card>
      
      <h3 className="subtitle">Timeline</h3>
      <div className="box">
        {application.events.length === 0 ? (
          <p className="has-text-grey">No events recorded yet.</p>
        ) : (
          <div className="timeline">
            {application.events.map((event) => (
              <div key={event.id} className="timeline-item mb-4 pb-4 border-bottom">
                <div className="is-size-7 has-text-grey">{new Date(event.timestamp).toLocaleString()}</div>
                <div className="has-text-weight-bold">{event.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DetailPageTemplate
      header={header}
      sidebar={sidebar}
      content={content}
    />
  );
};
