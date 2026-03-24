import React from 'react';
import type { ApplicationModel } from '../../domain/application/model';
import { StatusBadge } from '../molecules/StatusBadge';

interface ApplicationTableProps {
  applications: ApplicationModel[];
  onRowClick: (id: number) => void;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  applications,
  onRowClick,
}) => {
  if (applications.length === 0) {
    return (
      <div className="has-text-centered p-6 box">
        <p className="is-size-5 has-text-grey">No applications found.</p>
      </div>
    );
  }

  return (
    <div className="table-container box p-0">
      <table className="table is-fullwidth is-hoverable mb-0">
        <thead>
          <tr>
            <th>Company</th>
            <th>Title</th>
            <th>Status</th>
            <th>Applied At</th>
            <th>Last Contact</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr 
              key={app.id} 
              onClick={() => onRowClick(app.id)}
              style={{ cursor: 'pointer' }}
            >
              <td className="has-text-weight-bold">
                {app.company.name}
              </td>
              <td>{app.title}</td>
              <td>
                <StatusBadge status={app.status} />
              </td>
              <td className="is-size-7">
                {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}
              </td>
              <td className="is-size-7">
                {app.lastContactAt ? new Date(app.lastContactAt).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
