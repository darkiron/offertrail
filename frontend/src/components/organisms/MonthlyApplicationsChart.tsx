import React from 'react';
import type { MonthlyStats } from '../../types';

interface MonthlyApplicationsChartProps {
  data: MonthlyStats[];
  year: number;
}

const MonthlyApplicationsChart: React.FC<MonthlyApplicationsChartProps> = ({ data, year }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const barWidth = 40;
  const barGap = 10;
  const chartWidth = (barWidth + barGap) * data.length + barGap;

  return (
    <div className="card" style={{ padding: 'var(--spacing-md)' }}>
      <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-main)' }}>
          Monthly Applications
        </h3>
        <span className="badge" style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' }}>
          {year}
        </span>
      </div>

      {data.every(d => d.count === 0) ? (
        <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          No application data available for {year}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 'var(--spacing-sm)' }}>
          <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * (1 - percent)}
                x2={chartWidth}
                y2={chartHeight * (1 - percent)}
                stroke="var(--border)"
                strokeDasharray="4 2"
              />
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const barHeight = (d.count / maxCount) * chartHeight;
              const x = barGap + i * (barWidth + barGap);
              const y = chartHeight - barHeight;

              return (
                <g key={d.month}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="var(--accent)"
                    rx="4"
                    className="chart-bar"
                  >
                    <title>{`${d.month}: ${d.count} applications`}</title>
                  </rect>
                  
                  {/* Label (Month) */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    fill="var(--text-dim)"
                    style={{ fontSize: 'var(--font-size-xs)' }}
                  >
                    {d.month}
                  </text>

                  {/* Count on top of bar (if height allows) */}
                  {d.count > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fill="var(--text-main)"
                      style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}
                    >
                      {d.count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
      
      <style>{`
        .chart-bar:hover {
          fill: var(--accent-hover);
          cursor: help;
        }
      `}</style>
    </div>
  );
};

export default MonthlyApplicationsChart;
