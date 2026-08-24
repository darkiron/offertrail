import {
  IconArrowUpRight,
  IconBuilding,
  IconCalendarEvent,
  IconUser,
} from '@tabler/icons-react';
import { useI18n } from '../../../i18n';
import classes from './ProductPreview.module.scss';

export function ProductPreview() {
  const { t } = useI18n();
  const items = [
    [
      'landing.mock.item1title',
      'landing.mock.item1meta',
      'landing.mock.followup',
    ],
    [
      'landing.mock.item2title',
      'landing.mock.item2meta',
      'landing.mock.interview',
    ],
    [
      'landing.mock.item3title',
      'landing.mock.item3meta',
      'landing.mock.pending',
    ],
  ] as const;
  return (
    <figure className={classes.frame}>
      <div className={classes.toolbar}>
        <span>{t('landing.mock.activePipeline')}</span>
        <IconArrowUpRight aria-hidden="true" stroke={1.5} />
      </div>
      <div className={classes.content}>
        <div className={classes.pipeline}>
          {items.map(([title, meta, status], index) => (
            <article className={classes.application} key={title}>
              <span className={classes.index} aria-hidden="true">
                0{index + 1}
              </span>
              <div>
                <h3>{t(title)}</h3>
                <p>{t(meta)}</p>
              </div>
              <span className={classes.status}>{t(status)}</span>
            </article>
          ))}
        </div>
        <aside className={classes.context}>
          <p className={classes.kicker}>{t('landing.mock.keySignals')}</p>
          <h3>{t('landing.mock.frictionPoint')}</h3>
          <p>{t('landing.mock.frictionDesc')}</p>
          <ul>
            <li>
              <IconCalendarEvent aria-hidden="true" />
              {t('landing.mock.signal1')}
            </li>
            <li>
              <IconBuilding aria-hidden="true" />
              {t('landing.mock.signal2')}
            </li>
            <li>
              <IconUser aria-hidden="true" />
              {t('landing.mock.signal3')}
            </li>
          </ul>
        </aside>
      </div>
      <figcaption className={classes.caption}>
        {t('landing.aria.productPreviewCaption')}
      </figcaption>
    </figure>
  );
}
