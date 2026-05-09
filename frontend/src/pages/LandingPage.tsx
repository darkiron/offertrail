import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { CONFIG } from '../config';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  const features = [
    { icon: '📊', title: t('landing.features.kpi_title'),      desc: t('landing.features.kpi_desc') },
    { icon: '🔔', title: t('landing.features.followup_title'), desc: t('landing.features.followup_desc') },
    { icon: '🏢', title: t('landing.features.probity_title'),  desc: t('landing.features.probity_desc') },
    { icon: '📋', title: t('landing.features.history_title'),  desc: t('landing.features.history_desc') },
    { icon: '👥', title: t('landing.features.contacts_title'), desc: t('landing.features.contacts_desc') },
    { icon: '⚡', title: t('landing.features.start_title'),    desc: t('landing.features.start_desc') },
  ];

  const pricingPoints = [
    { title: t('landing.pricing.full_title'),       desc: t('landing.pricing.full_desc') },
    { title: t('landing.pricing.nolock_title'),     desc: t('landing.pricing.nolock_desc') },
    { title: t('landing.pricing.oneplan_title'),    desc: t('landing.pricing.oneplan_desc').replace('{price}', CONFIG.PRO_PRICE) },
    { title: t('landing.pricing.structured_title'), desc: t('landing.pricing.structured_desc') },
  ];

  useEffect(() => {
    document.title = t('landing.hero.pageTitle');
  }, [t]);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="lp-root">

      {/* ─── Hero ─── */}
      <section className="lp-hero">
        <div className="lp-badge">{t('landing.hero.badge')}</div>
        <h1 className="lp-h1">
          {t('landing.hero.titleLine1')}<br />
          <span>{t('landing.hero.titleLine2')}</span>
        </h1>
        <p className="lp-hero-sub">{t('landing.hero.sub')}</p>
        <div className="lp-hero-actions">
          <Link to="/register" className="lp-btn-primary">{t('landing.hero.ctaPrimary')}</Link>
          <a href="#features" className="lp-btn-outline">{t('landing.hero.ctaSecondary')}</a>
        </div>
      </section>

      {/* ─── Dashboard mockup ─── */}
      <div className="lp-mockup-wrap">
        <div className="lp-mockup-frame">
          <div className="lp-mockup-bar">
            <div className="lp-dot lp-dot-red" />
            <div className="lp-dot lp-dot-yellow" />
            <div className="lp-dot lp-dot-green" />
            <div className="lp-url-bar">app.offertrail.fr/app</div>
          </div>
          <div className="lp-stats-row">
            <div className="lp-stat"><div className="lp-stat-num">43</div><div className="lp-stat-label">{t('landing.mock.applications')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">69%</div><div className="lp-stat-label">{t('landing.mock.rejectionRate')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">20.9%</div><div className="lp-stat-label">{t('landing.mock.responseRate')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">7 {t('landing.mock.days')}</div><div className="lp-stat-label">{t('landing.mock.avgDelay')}</div></div>
          </div>
          <div className="lp-mock-body">
            <div className="lp-mock-grid">
              <div className="lp-panel">
                <p className="lp-panel-title">{t('landing.mock.activePipeline')}</p>
                <div className="lp-pipeline">
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mock.item1title')}</strong>
                      <span className="lp-meta">{t('landing.mock.item1meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-orange">{t('landing.mock.followup')}</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mock.item2title')}</strong>
                      <span className="lp-meta">{t('landing.mock.item2meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-blue">{t('landing.mock.interview')}</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mock.item3title')}</strong>
                      <span className="lp-meta">{t('landing.mock.item3meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-slate">{t('landing.mock.pending')}</span>
                  </div>
                </div>
              </div>
              <div className="lp-panel">
                <p className="lp-panel-title">{t('landing.mock.keySignals')}</p>
                <div className="lp-chart">
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mock.rejectionRate')}</span><span>69%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '69%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mock.responseRate')}</span><span>20.9%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '20.9%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mock.activeDossiers')}</span><span>11</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '26%' }} /></div>
                  </div>
                </div>
                <div className="lp-signal">
                  <strong>{t('landing.mock.frictionPoint')}</strong>
                  <p>{t('landing.mock.frictionDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="lp-section-wrap lp-alt">
        <div className="lp-section-inner">
          <div className="lp-section-kicker">{t('landing.features.kicker')}</div>
          <h2 className="lp-section-title">{t('landing.features.title')}</h2>
          <div className="lp-feature-grid">
            {features.map((f) => (
              <div key={f.title} className="lp-feature">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="lp-section-wrap" id="tarifs">
        <div className="lp-section-inner">
          <div className="lp-section-kicker">{t('landing.pricing.kicker')}</div>
          <h2 className="lp-section-title">{t('landing.pricing.title')}</h2>
          <div className="lp-pricing-grid">
            <div className="lp-pricing-copy">
              {pricingPoints.map((p) => (
                <div key={p.title} className="lp-pricing-point">
                  <div className="lp-pricing-check">✓</div>
                  <div>
                    <div className="lp-pricing-point-title">{p.title}</div>
                    <div className="lp-pricing-point-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-plan-card">
              <div className="lp-plan-name">{t('landing.pricing.planName')}</div>
              <div className="lp-plan-price">{CONFIG.PRO_PRICE} <span className="lp-plan-period">{t('landing.pricing.perMonth')}</span></div>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                <li>{t('landing.pricing.feature1')}</li>
                <li>{t('landing.pricing.feature2')}</li>
                <li>{t('landing.pricing.feature3')}</li>
                <li>{t('landing.pricing.feature4')}</li>
                <li>{t('landing.pricing.feature5')}</li>
                <li>{t('landing.pricing.feature6')}</li>
              </ul>
              <Link to="/register" className="lp-plan-cta">{t('landing.pricing.cta')}</Link>
              <p className="lp-plan-note">{t('landing.pricing.note').replace('{price}', CONFIG.PRO_PRICE)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CraftCodes section ─── */}
      <section className="lp-section-wrap" id="craftcodes">
        <div className="lp-section-inner" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <div className="lp-section-kicker">{t('landing.craftcodes.kicker')}</div>
          <h2 className="lp-section-title">{t('landing.craftcodes.title')}</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.7, marginBottom: '2rem', opacity: 0.75 }}>
            {t('landing.craftcodes.descPrefix')}{' '}
            <a href="https://craftcodes.fr" target="_blank" rel="noopener noreferrer" className="lp-link">
              CraftCodes
            </a>
            {t('landing.craftcodes.descSuffix')}
          </p>

          <div className="lp-plan-card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, opacity: 0.5, margin: '0 0 16px' }}>
              {t('landing.craftcodes.label').replace('{price}', CONFIG.PRO_PRICE)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(128,128,128,0.2)', fontSize: '14px' }}>
              <span style={{ opacity: 0.6 }}>{t('landing.craftcodes.stripe')}</span>
              <span style={{ opacity: 0.6 }}>~0,47€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(128,128,128,0.2)', fontSize: '14px' }}>
              <span style={{ opacity: 0.6 }}>{t('landing.craftcodes.urssaf')}</span>
              <span style={{ opacity: 0.6 }}>~4,79€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px', fontWeight: 600 }}>
              <span>{t('landing.craftcodes.devPay')}</span>
              <span className="lp-link">~9,73€</span>
            </div>
            <p style={{ fontSize: '12px', opacity: 0.4, margin: '12px 0 0', lineHeight: 1.6 }}>
              {t('landing.craftcodes.noInvestors')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="lp-cta-section">
        <h2>{t('landing.cta.title')}</h2>
        <p>{t('landing.cta.sub')}</p>
        <Link to="/register" className="lp-btn-primary">{t('landing.cta.btn')}</Link>
      </section>

    </div>
  );
};
