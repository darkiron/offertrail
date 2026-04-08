import { Card, Text, Stack } from '@mantine/core';
import classes from './KPICard.module.css';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export function KPICard({ label, value, subValue }: KPICardProps) {
  return (
    <Card className={classes.card} radius="lg" padding="lg">
      <Stack gap={4}>
        <Text className={classes.label} c="dimmed">{label}</Text>
        <Text size="xl" fw={700} lh={1}>{value}</Text>
        {subValue && <Text size="sm" c="dimmed">{subValue}</Text>}
      </Stack>
    </Card>
  );
}
