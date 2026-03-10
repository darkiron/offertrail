import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, subValue }) => {
  return (
    <div className="card flex-col gap-sm">
      <div className="text-sm text-dim font-bold">{label}</div>
      <div className="text-xxl font-bold">{value}</div>
      {subValue && <div className="text-sm text-dim">{subValue}</div>}
    </div>
  );
};
