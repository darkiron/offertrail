import type { Icon } from '@tabler/icons-react';
import classes from './FeatureCard.module.scss';

export function FeatureCard({
  icon: FeatureIcon,
  title,
  description,
}: {
  icon: Icon;
  title: string;
  description: string;
}) {
  return (
    <article className={classes.card}>
      <FeatureIcon aria-hidden="true" className={classes.icon} stroke={1.6} />
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
