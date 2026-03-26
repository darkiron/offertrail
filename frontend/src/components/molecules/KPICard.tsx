import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, subValue }) => {
  return (
    <div
      className="card flex-col gap-sm"
      style={{
        borderRadius: 18,
        padding: '1.25rem',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--bg-mantle) 88%, white 12%), var(--bg-mantle))',
      }}
    >
      <div className="text-sm text-dim font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div className="text-xxl font-bold" style={{ lineHeight: 1 }}>
        {value}
      </div>
      {subValue ? <div className="text-sm text-dim">{subValue}</div> : null}
    </div>
  );
};
