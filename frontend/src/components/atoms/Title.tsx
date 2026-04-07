import { Title as MantineTitle, Text, type TitleProps as MantineTitleProps } from '@mantine/core';
import type { JSX } from 'react';

interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  subtitle?: boolean;
  className?: string;
}

export function Title({ children, level = 1, subtitle = false, className }: TitleProps) {
  if (subtitle) {
    return (
      <Text c="dimmed" size="sm" className={className}>
        {children}
      </Text>
    );
  }

  const order = level as MantineTitleProps['order'];
  return (
    <MantineTitle order={order} className={className}>
      {children}
    </MantineTitle>
  );
}
