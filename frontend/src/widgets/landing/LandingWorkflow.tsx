import {
  IconBell,
  IconBriefcase,
  IconChartDots,
  IconUsers,
} from '@tabler/icons-react';
import { useI18n } from '../../i18n';
import { FeatureCard } from './FeatureCard';
import classes from './LandingWorkflow.module.scss';

export function LandingWorkflow() {
  const { t } = useI18n();
  const features = [
    {
      icon: IconChartDots,
      title: t('landing.features.kpi_title'),
      description: t('landing.features.kpi_desc'),
    },
    {
      icon: IconBell,
      title: t('landing.features.followup_title'),
      description: t('landing.features.followup_desc'),
    },
    {
      icon: IconBriefcase,
      title: t('landing.features.history_title'),
      description: t('landing.features.history_desc'),
    },
    {
      icon: IconUsers,
      title: t('landing.features.contacts_title'),
      description: t('landing.features.contacts_desc'),
    },
  ];
  return (
    <section
      className={classes.section}
      id="workflow"
      aria-labelledby="workflow-title"
    >
      <div className={classes.heading}>
        <p>{t('landing.workflow.kicker')}</p>
        <h2 id="workflow-title">{t('landing.workflow.title')}</h2>
        <span>{t('landing.workflow.sub')}</span>
      </div>
      <ol className={classes.steps}>
        {(['1', '2', '3'] as const).map((number) => (
          <li key={number}>
            <span aria-hidden="true">0{number}</span>
            <div>
              <h3>{t(`landing.workflow.step${number}Title`)}</h3>
              <p>{t(`landing.workflow.step${number}Desc`)}</p>
            </div>
          </li>
        ))}
      </ol>
      <div
        id="features"
        className={classes.features}
        aria-label={t('landing.aria.features')}
      >
        <div className={classes.featureIntro}>
          <p>{t('landing.features.kicker')}</p>
          <h2>{t('landing.features.title')}</h2>
        </div>
        <div>
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
      <p className={classes.proof}>{t('landing.workflow.proof')}</p>
    </section>
  );
}
