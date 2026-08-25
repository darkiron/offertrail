
type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = 'medium', className }: SpinnerProps) {
  return <span role="status" aria-label="Chargement" className={`ot-spinner ot-spinner--${size} ${className ?? ''}`} />;
}
