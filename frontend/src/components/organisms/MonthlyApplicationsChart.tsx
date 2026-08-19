import { UiBadge as Badge, UiGroup as Group, UiText as Text, UiPaper as Card } from '../atoms/UiPrimitives';
import type { MonthlyStats } from '../../types';
import classes from './MonthlyApplicationsChart.module.css';

interface MonthlyApplicationsChartProps {
  data: MonthlyStats[];
  year: number;
}

export function MonthlyApplicationsChart({ data, year }: MonthlyApplicationsChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const barWidth = 40;
  const barGap = 10;
  const chartWidth = (barWidth + barGap) * data.length + barGap;

  return (
    <Card radius="lg" padding="lg">
      <Group justify="space-between" mb="md">
        <Text fw={600}>Monthly Applications</Text>
        <Badge variant="filled" size="sm">{year}</Badge>
      </Group>

      {data.every((d) => d.count === 0) ? (
        <Text
          c="dimmed"
          fs="italic"
          ta="center"
          style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          No application data available for {year}
        </Text>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * (1 - percent)}
                x2={chartWidth}
                y2={chartHeight * (1 - percent)}
                stroke="var(--ot-line)"
                strokeDasharray="4 2"
              />
            ))}

            {data.map((d, i) => {
              const barHeight = (d.count / maxCount) * chartHeight;
              const x = barGap + i * (barWidth + barGap);
              const y = chartHeight - barHeight;

              return (
                <g key={d.month}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="var(--ot-accent)"
                    rx="4"
                    className={classes.bar}
                  >
                    <title>{`${d.month}: ${d.count} applications`}</title>
                  </rect>
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    fill="var(--ot-muted)"
                    fontSize="11"
                  >
                    {d.month}
                  </text>
                  {d.count > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fill="var(--ot-ink)"
                      fontSize="11"
                      fontWeight="bold"
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
    </Card>
  );
}

export default MonthlyApplicationsChart;
