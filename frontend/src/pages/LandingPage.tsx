import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../config';
import { useI18n } from '../i18n';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  const features = [
    { icon: '📊', title: t('landing.features.items.kpis.title'), desc: t('landing.features.items.kpis.desc') },
    { icon: '🔔', title: t('landing.features.items.followups.title'), desc: t('landing.features.items.followups.desc') },
    { icon: '🏢', title: t('landing.features.items.probity.title'), desc: t('landing.features.items.probity.desc') },
    { icon: '📋', title: t('landing.features.items.history.title'), desc: t('landing.features.items.history.desc') },
    { icon: '👥', title: t('landing.features.items.contacts.title'), desc: t('landing.features.items.contacts.desc') },
    { icon: '⚡', title: t('landing.features.items.immediate.title'), desc: t('landing.features.items.immediate.desc') },
  ];

  useEffect(() => {
    document.title = 'OfferTrail — ' + t('landing.hero.title');
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
          {t('landing.hero.title')}<br />
          <span>{t('landing.hero.subtitle')}</span>
        </h1>
        <p className="lp-hero-sub">
          {t('landing.hero.copy')}
        </p>
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
            <div className="lp-url-bar">{t('landing.mockup.url')}</div>
          </div>
          <div className="lp-stats-row">
            <div className="lp-stat"><div className="lp-stat-num">43</div><div className="lp-stat-label">{t('landing.mockup.stats.followed')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">69%</div><div className="lp-stat-label">{t('landing.mockup.stats.rejectionRate')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">20.9%</div><div className="lp-stat-label">{t('landing.mockup.stats.responseRate')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">7 j</div><div className="lp-stat-label">{t('landing.mockup.stats.avgResponse')}</div></div>
          </div>
          <div className="lp-mock-body">
            <div className="lp-mock-grid">
              <div className="lp-panel">
                <p className="lp-panel-title">{t('landing.mockup.pipeline.title')}</p>
                <div className="lp-pipeline">
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mockup.pipeline.item1.title')}</strong>
                      <span className="lp-meta">{t('landing.mockup.pipeline.item1.meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-orange">{t('landing.mockup.pipeline.status.followup')}</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mockup.pipeline.item2.title')}</strong>
                      <span className="lp-meta">{t('landing.mockup.pipeline.item2.meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-blue">{t('landing.mockup.pipeline.status.interview')}</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mockup.pipeline.item3.title')}</strong>
                      <span className="lp-meta">{t('landing.mockup.pipeline.item3.meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-slate">{t('landing.mockup.pipeline.status.pending')}</span>
                  </div>
                </div>
              </div>
              <div className="lp-panel">
                <p className="lp-panel-title">{t('landing.mockup.signals.title')}</p>
                <div className="lp-chart">
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mockup.stats.rejectionRate')}</span><span>69%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '69%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mockup.stats.responseRate')}</span><span>20.9%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '20.9%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('dashboard.activePipeline')}</span><span>11</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '26%' }} /></div>
                  </div>
                </div>
                <div className="lp-signal">
                  <strong>{t('landing.mockup.signals.friction')}</strong>
                  <p>{t('landing.mockup.signals.frictionCopy')}</p>
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
      <section className="lp-section-wrap">
        <div className="lp-section-inner">
          <div className="lp-section-kicker">{t('landing.pricing.kicker')}</div>
          <h2 className="lp-section-title">{t('landing.pricing.title')}</h2>
          <div className="lp-pricing-grid">
            <div className="lp-pricing-copy">
              {[
                { title: t('landing.pricing.points.full.title'), desc: t('landing.pricing.points.full.desc') },
                { title: t('landing.pricing.points.noCommitment.title'), desc: t('landing.pricing.points.noCommitment.desc') },
                { title: t('landing.pricing.points.unique.title'), desc: t('landing.pricing.points.unique.desc', { price: CONFIG.PRO_PRICE }) },
                { title: t('landing.pricing.points.structured.title'), desc: t('landing.pricing.points.structured.desc') },
              ].map((p) => (
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
              <div className="lp-plan-name">{t('landing.pricing.card.name')}</div>
              <div className="lp-plan-price">{CONFIG.PRO_PRICE} <span className="lp-plan-period">{t('landing.pricing.card.period')}</span></div>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                <li>{t('landing.pricing.card.features.unlimited')}</li>
                <li>{t('landing.pricing.card.features.dashboard')}</li>
                <li>{t('landing.pricing.card.features.tracking')}</li>
                <li>{t('landing.pricing.card.features.linked')}</li>
                <li>{t('landing.pricing.card.features.probity')}</li>
                <li>{t('landing.pricing.card.features.import')}</li>
              </ul>
              <Link to="/register" className="lp-plan-cta">{t('landing.pricing.card.cta')}</Link>
              <p className="lp-plan-note">{t('landing.pricing.card.note', { price: CONFIG.PRO_PRICE })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CraftCodes section ─── */}
      <section className="lp-section-wrap" id="craftcodes">
        <div className="lp-section-inner" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <div className="lp-section-kicker">{t('landing.transparency.kicker')}</div>
          <h2 className="lp-section-title">{t('landing.transparency.title')}</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.7, marginBottom: '2rem', opacity: 0.75 }}>
            {t('landing.transparency.copy')}
          </p>

          <div className="lp-plan-card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, opacity: 0.5, margin: '0 0 16px' }}>
              {t('landing.transparency.breakdown.title', { totalPrice: CONFIG.PRO_PRICE })}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(128,128,128,0.2)', fontSize: '14px' }}>
              <span style={{ opacity: 0.6 }}>{t('landing.transparency.breakdown.stripe')}</span>
              <span style={{ opacity: 0.6 }}>~0,47€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(128,128,128,0.2)', fontSize: '14px' }}>
              <span style={{ opacity: 0.6 }}>{t('landing.transparency.breakdown.taxes')}</span>
              <span style={{ opacity: 0.6 }}>~4,79€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px', fontWeight: 600 }}>
              <span>{t('landing.transparency.breakdown.dev')}</span>
              <span className="lp-link">~9,73€</span>
            </div>
            <p style={{ fontSize: '12px', opacity: 0.4, margin: '12px 0 0', lineHeight: 1.6 }}>
              {t('landing.transparency.breakdown.note')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="lp-cta-section">
        <h2>{t('landing.cta.title')}</h2>
        <p>{t('landing.cta.copy')}</p>
        <Link to="/register" className="lp-btn-primary">{t('landing.cta.btn')}</Link>
      </section>

    </div>
  );
};
