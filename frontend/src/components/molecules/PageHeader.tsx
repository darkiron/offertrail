import type { ReactNode } from 'react';
import { Group, Badge, Title, Text, Stack } from '@mantine/core';

interface PageHeaderProps {
  title: string;
  kicker?: string;
  count?: number | null;
  actions?: ReactNode;
  description?: string;
}

export function PageHeader({ title, kicker, count, actions, description }: PageHeaderProps) {
  return (
    <Stack gap={4}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          {kicker && (
            <Text size="xs" fw={700} tt="uppercase" ls="0.08em" c="dimmed">{kicker}</Text>
          )}
          <Group gap="sm" align="center">
            <Title order={2}>{title}</Title>
            {count != null && (
              <Badge variant="light" size="md" radius="xl">{count}</Badge>
            )}
          </Group>
        </Stack>
        {actions && (
          <Group gap="sm" wrap="nowrap" mt={kicker ? 18 : 0}>{actions}</Group>
        )}
      </Group>
      {description && (
        <Text size="sm" c="dimmed">{description}</Text>
      )}
    </Stack>
  );
}
