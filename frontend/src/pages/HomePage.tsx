import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import { useI18n } from '../i18n';
import classes from './HomePage.module.css';

export function HomePage() {
  const { t } = useI18n();

  const FEATURES = useMemo(() => [
    {
      icon: '⚡',
      title: t('landing.mockup.pipeline.title'),
      desc: t('auth.story.point1.desc'),
    },
    {
      icon: '🏢',
      title: t('landing.features.items.probity.title'),
      desc: t('landing.features.items.probity.desc'),
    },
    {
      icon: '🔔',
      title: t('landing.features.items.followups.title'),
      desc: t('landing.features.items.followups.desc'),
    },
    {
      icon: '📊',
      title: t('landing.features.items.kpis.title'),
      desc: t('landing.features.items.kpis.desc'),
    },
    {
      icon: '📇',
      title: t('landing.features.items.contacts.title'),
      desc: t('landing.features.items.contacts.desc'),
    },
    {
      icon: '☁️',
      title: t('landing.features.items.immediate.title'),
      desc: t('landing.features.items.immediate.desc'),
    },
  ], [t]);

  const PLAN_PRO = useMemo(() => [
    t('landing.pricing.card.features.unlimited'),
    t('landing.pricing.card.features.dashboard'),
    t('landing.pricing.card.features.linked'),
    t('landing.pricing.card.features.probity'),
    t('landing.pricing.card.features.tracking'),
    t('landing.pricing.card.features.import'),
  ], [t]);

  useEffect(() => {
    document.title = 'OfferTrail — ' + t('auth.story.title');
  }, [t]);

  return (
    <>
      {/* ── Hero ── */}
      <section className={classes.hero}>
        <span className={classes.eyebrow}>🚀 {t('auth.story.copy').split('—')[0].trim()}</span>

        <h1 className={classes.heroTitle}>
          {t('auth.story.title').split(' ').slice(0, 3).join(' ')}<br />
          <em>{t('auth.story.title').split(' ').slice(3).join(' ')}</em>
        </h1>

        <p className={classes.heroSub}>
          {t('auth.story.copy')}
        </p>

        <div className={classes.heroCta}>
          <Link to="/register" className={classes.btnHeroPrimary}>
            {t('landing.hero.ctaPrimary')}
          </Link>
          <a href="#fonctionnalites" className={classes.btnHeroOutline}>
            {t('landing.hero.ctaSecondary')}
          </a>
        </div>

        <p className={classes.proof}>
          <span className={classes.proofDot} />
          {CONFIG.PRO_PRICE}{t('landing.pricing.card.period')} · {t('landing.pricing.card.note', { price: '' }).split('·')[1].trim()}
        </p>
      </section>

      {/* ── App preview ── */}
      <div className={classes.previewWrap}>
        <div className={classes.previewInner}>
          <div className={classes.previewBar}>
            <div className={classes.previewDot} />
            <div className={classes.previewDot} />
            <div className={classes.previewDot} />
          </div>
          <div className={classes.previewContent}>
            <div className={classes.previewSidebar}>
              {['Dashboard', 'Candidatures', 'Entreprises', 'Contacts', 'Import'].map((item, i) => (
                <div key={item} className={`${classes.previewNavItem}${i === 0 ? ` ${classes.active}` : ''}`}>
                  {item}
                </div>
              ))}
            </div>
            <div className={classes.previewMain}>
              <div className={classes.previewKpis}>
                {[
                  { val: '24', label: 'Candidatures' },
                  { val: '6', label: 'En cours' },
                  { val: '3', label: 'Relances dues' },
                ].map((k) => (
                  <div key={k.label} className={classes.previewKpi}>
                    <div className={classes.previewKpiVal}>{k.val}</div>
                    <div className={classes.previewKpiLabel}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div className={classes.previewRows}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={classes.previewRow} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section id="fonctionnalites" className={classes.features}>
        <div className={classes.sectionLabel}>
          <div className={classes.sectionEyebrow}>✦ Fonctionnalités</div>
          <h2 className={classes.sectionTitle}>Tout ce qu'il te faut pour postuler avec méthode</h2>
          <p className={classes.sectionSub}>
            Un outil taillé pour structurer ta recherche d'emploi, du premier contact à l'offre signée.
          </p>
        </div>
        <div className={classes.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={classes.featureCard}>
              <div className={classes.featureIcon}>{f.icon}</div>
              <p className={classes.featureTitle}>{f.title}</p>
              <p className={classes.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="tarifs" className={classes.pricing}>
        <div className={classes.sectionLabel}>
          <div className={classes.sectionEyebrow}>💳 Tarif</div>
          <h2 className={classes.sectionTitle}>Un seul plan, tout inclus</h2>
          <p className={classes.sectionSub}>Accès complet à toutes les fonctionnalités. Sans surprise.</p>
        </div>
        <div className={classes.pricingGrid}>
          <div className={`${classes.planCard} ${classes.featured}`}>
            <span className={classes.planBadge}>Pro</span>
            <h3 className={classes.planName}>Pour les candidats sérieux</h3>
            <div className={classes.planPrice}>
              {CONFIG.PRO_PRICE}<span className={classes.planPeriod}>/mois</span>
            </div>
            <p className={classes.planDesc}>Tout ce qu'il faut pour piloter ta recherche d'emploi avec méthode.</p>
            <ul className={classes.planFeatures}>
              {PLAN_PRO.map((f) => (
                <li key={f}>
                  <span className={classes.checkmark}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${classes.planCta} ${classes.primary}`}>
              Démarrer maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className={classes.ctaSection}>
        <div className={classes.ctaInner}>
          <h2 className={classes.ctaTitle}>Prêt à structurer ta recherche ?</h2>
          <p className={classes.ctaSub}>Rejoins OfferTrail. {CONFIG.PRO_PRICE}/mois, sans engagement.</p>
          <Link to="/register" className={classes.btnHeroPrimary}>
            Créer mon compte →
          </Link>
        </div>
      </section>
    </>
  );
}
