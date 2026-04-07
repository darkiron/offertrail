import { Stack, ThemeIcon, Text } from '@mantine/core';
import { IconFolderOpen } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Title } from './Title';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Stack align="center" justify="center" gap="md" py="xl" className={className}>
      <ThemeIcon size={64} radius="xl" variant="light" color="gray">
        {icon ?? <IconFolderOpen size={32} />}
      </ThemeIcon>
      <Title level={4}>{title}</Title>
      {description && (
        <Text c="dimmed" size="sm" ta="center">
          {description}
        </Text>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Stack>
  );
}
