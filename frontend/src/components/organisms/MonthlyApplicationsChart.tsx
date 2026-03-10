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
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--ctp-mocha-text)' }}>
          Monthly Applications
        </h3>
        <span className="badge" style={{ backgroundColor: 'var(--ctp-mocha-blue)', color: 'white' }}>
          {year}
        </span>
      </div>

      {data.every(d => d.count === 0) ? (
        <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ctp-mocha-subtext0)', fontStyle: 'italic' }}>
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
                stroke="var(--ctp-mocha-surface1)"
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
                    fill="var(--ctp-mocha-blue)"
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
                    fill="var(--ctp-mocha-subtext1)"
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
                      fill="var(--ctp-mocha-text)"
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
          fill: var(--ctp-mocha-sapphire);
          cursor: help;
        }
      `}</style>
    </div>
  );
};

export default MonthlyApplicationsChart;
