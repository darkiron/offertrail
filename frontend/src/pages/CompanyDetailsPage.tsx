import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CompanyModel, mapCompanyDtoToModel } from '../domain/company/model';
import { mapApplicationDtoToModel } from '../domain/application/model';
import { DetailPageTemplate } from '../components/templates/DetailPageTemplate';
import { Badge } from '../components/atoms/Badge';
import { ApplicationTable } from '../components/organisms/ApplicationTable';

interface CompanyDetailsPageProps {
  id: number;
}

export const CompanyDetailsPage: React.FC<CompanyDetailsPageProps> = ({ id }) => {
  const [company, setCompany] = useState<CompanyModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.getCompany(id);
        setCompany(mapCompanyDtoToModel(response));
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div className="section">Loading...</div>;
  if (!company) return <div className="section">Company not found.</div>;

  const header = (
    <div>
      <h1 className="title mb-1">{company.name}</h1>
      <div className="mt-2">
        <Badge variant="info" className="mr-2">{company.type}</Badge>
        <Badge variant={company.globalFlagLevel === 'red' ? 'danger' : company.globalFlagLevel === 'orange' ? 'warning' : 'success'}>
          {company.globalFlagLevel.toUpperCase()}
        </Badge>
      </div>
    </div>
  );

  const sidebar = (
    <div className="box">
      <h3 className="subtitle is-5">Aggregated Stats</h3>
      <div className="columns is-multiline">
        <div className="column is-6 has-text-centered">
          <p className="heading">Applications</p>
          <p className="title is-5">{company.metrics.totalApplications}</p>
        </div>
        <div className="column is-6 has-text-centered">
          <p className="heading">Response Rate</p>
          <p className="title is-5">{company.metrics.responseRate}%</p>
        </div>
        <div className="column is-6 has-text-centered">
          <p className="heading">Rejections</p>
          <p className="title is-5">{company.metrics.rejections}</p>
        </div>
        <div className="column is-6 has-text-centered">
          <p className="heading">Ghosting</p>
          <p className="title is-5">{company.metrics.ghostingRate}%</p>
        </div>
      </div>
      <hr />
      <p><strong>Website:</strong> {company.website || '-'}</p>
      <p><strong>Location:</strong> {company.location || '-'}</p>
    </div>
  );

  const content = (
    <div>
      <h2 className="subtitle">Applications</h2>
      <ApplicationTable 
        applications={(company as any).applications?.map(mapApplicationDtoToModel) || []}
        onRowClick={(appId) => window.location.hash = `/applications/${appId}`}
      />
      
      <h2 className="subtitle mt-6">Offers</h2>
      <div className="box">
        {((company as any).offers || []).length === 0 ? (
          <p className="has-text-grey">No offers recorded yet.</p>
        ) : (
          <ul>
            {((company as any).offers || []).map((offer: any) => (
              <li key={offer.id} className="mb-2">
                <strong>{offer.title}</strong> ({offer.type})
              </li>
            ))}
          </ul>
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
