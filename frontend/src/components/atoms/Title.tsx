
interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  subtitle?: boolean;
  className?: string;
}

export function Title({ children, level = 1, subtitle = false, className }: TitleProps) {
  if (subtitle) {
    return <p className={`ot-subtitle ${className ?? ''}`}>{children}</p>;
  }

  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className={`ot-title ot-title--${level} ${className ?? ''}`}>{children}</Tag>;
}
