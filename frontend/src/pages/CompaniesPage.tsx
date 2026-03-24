import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CompanyModel, mapCompanyDtoToModel } from '../domain/company/model';
import { ListPageTemplate } from '../components/templates/ListPageTemplate';
import { Card } from '../components/atoms/Card';
import { Badge } from '../components/atoms/Badge';
import { SearchInput } from '../components/molecules/SearchInput';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Assuming getCompanies supports search or we filter locally
      const response = await api.getCompanies();
      const mapped = response.map(mapCompanyDtoToModel);
      setCompanies(mapped.filter((c: CompanyModel) => 
        c.name.toLowerCase().includes(search.toLowerCase())
      ));
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const content = (
    <div className="columns is-multiline">
      {companies.map((company) => (
        <div key={company.id} className="column is-4">
          <Card 
            title={company.name} 
            className="h-full"
            footer={
              <a href={`#/companies/${company.id}`} className="card-footer-item">View Details</a>
            }
          >
            <div className="mb-2">
              <Badge variant="info">{company.type}</Badge>
              <Badge variant={company.globalFlagLevel === 'red' ? 'danger' : company.globalFlagLevel === 'orange' ? 'warning' : 'success'} className="ml-2">
                {company.globalFlagLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="level is-mobile mt-4">
              <div className="level-item has-text-centered">
                <div>
                  <p className="heading">Apps</p>
                  <p className="title is-5">{company.metrics.totalApplications}</p>
                </div>
              </div>
              <div className="level-item has-text-centered">
                <div>
                  <p className="heading">Response</p>
                  <p className="title is-5">{company.metrics.responseRate}%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );

  return (
    <ListPageTemplate
      title="Companies"
      isLoading={isLoading}
      filters={
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search companies..." 
          isLoading={isLoading}
        />
      }
      content={content}
    />
  );
};
