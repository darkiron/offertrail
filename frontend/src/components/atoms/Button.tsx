import { Button as MantineButton, type ButtonProps as MantineButtonProps } from '@mantine/core';

type Variant = 'primary' | 'ghost' | 'secondary';
type Size = 'small' | 'normal';

interface ButtonProps extends Omit<MantineButtonProps, 'variant' | 'size'> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_MAP: Record<Variant, MantineButtonProps['variant']> = {
  primary: 'filled',
  ghost: 'outline',
  secondary: 'default',
};

const SIZE_MAP: Record<Size, MantineButtonProps['size']> = {
  small: 'xs',
  normal: 'sm',
};

export function Button({ variant = 'secondary', size = 'normal', ...rest }: ButtonProps) {
  return (
    <MantineButton
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      radius="xl"
      {...rest}
    />
  );
}
