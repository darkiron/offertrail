import { Loader, type LoaderProps } from '@mantine/core';

type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const SIZE_MAP: Record<SpinnerSize, LoaderProps['size']> = {
  small: 'xs',
  medium: 'sm',
  large: 'md',
};

export function Spinner({ size = 'medium', className }: SpinnerProps) {
  return <Loader size={SIZE_MAP[size]} className={className} />;
}
