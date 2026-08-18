import classes from './KPICard.module.css';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export function KPICard({ label, value, subValue }: KPICardProps) {
  return (
    <article className={classes.card}>
      <span className={classes.label}>{label}</span>
      <strong className={classes.value}>{value}</strong>
      {subValue && <span className={classes.subValue}>{subValue}</span>}
    </article>
  );
}
