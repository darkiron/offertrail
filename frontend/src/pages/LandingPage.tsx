import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { CONFIG } from '../config';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    document.title = t('landing.pageTitle');
  }, [t]);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const features = [
    { icon: t('landing.feature1Icon'), title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: t('landing.feature2Icon'), title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: t('landing.feature3Icon'), title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { icon: t('landing.feature4Icon'), title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
    { icon: t('landing.feature5Icon'), title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
    { icon: t('landing.feature6Icon'), title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  ];

  const pricingPoints = [
    { title: t('landing.pricing1Title'), desc: t('landing.pricing1Desc') },
    { title: t('landing.pricing2Title'), desc: t('landing.pricing2Desc') },
    { title: t('landing.pricing3Title'), desc: t('landing.pricing3Desc', { price: CONFIG.PRO_PRICE }) },
    { title: t('landing.pricing4Title'), desc: t('landing.pricing4Desc') },
  ];

  return (
    <div className="lp-root">

      {/* ─── Hero ─── */}
      <section className="lp-hero">
        <div className="lp-badge">{t('landing.badge')}</div>
        <h1 className="lp-h1">
          {t('landing.heroTitle1')}<br />
          <span>{t('landing.heroTitle2')}</span>
        </h1>
        <p className="lp-hero-sub">{t('landing.heroSub')}</p>
        <div className="lp-hero-actions">
          <Link to="/register" className="lp-btn-primary">{t('landing.cta')}</Link>
          <a href="#features" className="lp-btn-outline">{t('landing.ctaHow')}</a>
        </div>
      </section>

      {/* ─── Dashboard mockup ─── */}
      <div className="lp-mockup-wrap">
        <div className="lp-mockup-frame">
          <div className="lp-mockup-bar">
            <div className="lp-dot lp-dot-red" />
            <div className="lp-dot lp-dot-yellow" />
            <div className="lp-dot lp-dot-green" />
            <div className="lp-url-bar">{t('landing.mockupUrl')}</div>
          </div>
          <div className="lp-stats-row">
            <div className="lp-stat"><div className="lp-stat-num">43</div><div className="lp-stat-label">{t('landing.mockupStat1Label')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">69%</div><div className="lp-stat-label">{t('landing.mockupStat2Label')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">20.9%</div><div className="lp-stat-label">{t('landing.mockupStat3Label')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">{t('landing.mockupStat4Value')}</div><div className="lp-stat-label">{t('landing.mockupStat4Label')}</div></div>
          </div>
          <div className="lp-mock-body">
            <div className="lp-mock-grid">
              <div className="lp-panel">
                <p className="lp-panel-title">{t('landing.mockupPipelineTitle')}</p>
                <div className="lp-pipeline">
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mockupItem1Title')}</strong>
                      <span className="lp-meta">{t('landing.mockupItem1Meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-orange">{t('landing.mockupItem1Status')}</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mockupItem2Title')}</strong>
                      <span className="lp-meta">{t('landing.mockupItem2Meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-blue">{t('landing.mockupItem2Status')}</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>{t('landing.mockupItem3Title')}</strong>
                      <span className="lp-meta">{t('landing.mockupItem3Meta')}</span>
                    </div>
                    <span className="lp-pill lp-pill-slate">{t('landing.mockupItem3Status')}</span>
                  </div>
                </div>
              </div>
              <div className="lp-panel">
                <p className="lp-panel-title">{t('landing.mockupSignalsTitle')}</p>
                <div className="lp-chart">
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mockupBarRefusal')}</span><span>69%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '69%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mockupBarResponse')}</span><span>20.9%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '20.9%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>{t('landing.mockupBarActive')}</span><span>11</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '26%' }} /></div>
                  </div>
                </div>
                <div className="lp-signal">
                  <strong>{t('landing.mockupFrictionTitle')}</strong>
                  <p>{t('landing.mockupFrictionDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="lp-section-wrap lp-alt">
        <div className="lp-section-inner">
          <div className="lp-section-kicker">{t('landing.featuresKicker')}</div>
          <h2 className="lp-section-title">{t('landing.featuresTitle')}</h2>
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
          <div className="lp-section-kicker">{t('landing.pricingKicker')}</div>
          <h2 className="lp-section-title">{t('landing.pricingTitle')}</h2>
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
              <div className="lp-plan-name">{t('landing.planName')}</div>
              <div className="lp-plan-price">{CONFIG.PRO_PRICE} <span className="lp-plan-period">{t('landing.planPeriod')}</span></div>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                <li>{t('landing.planFeature1')}</li>
                <li>{t('landing.planFeature2')}</li>
                <li>{t('landing.planFeature3')}</li>
                <li>{t('landing.planFeature4')}</li>
                <li>{t('landing.planFeature5')}</li>
                <li>{t('landing.planFeature6')}</li>
              </ul>
              <Link to="/register" className="lp-plan-cta">{t('landing.planCta')}</Link>
              <p className="lp-plan-note">{t('landing.planNote', { price: CONFIG.PRO_PRICE })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CraftCodes section ─── */}
      <section className="lp-section-wrap" id="craftcodes">
        <div className="lp-section-inner" style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <div className="lp-section-kicker">{t('landing.craftKicker')}</div>
          <h2 className="lp-section-title">{t('landing.craftTitle')}</h2>
          <p style={{ fontSize: '16px', lineHeight: 1.7, marginBottom: '2rem', opacity: 0.75 }}>
            {t('landing.craftDesc1')}{' '}
            <a href="https://craftcodes.fr" target="_blank" rel="noopener noreferrer" className="lp-link">
              CraftCodes
            </a>
            {', '}{t('landing.craftDesc2')}
          </p>

          <div className="lp-plan-card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, opacity: 0.5, margin: '0 0 16px' }}>
              {t('landing.craftBreakdownLabel', { price: CONFIG.PRO_PRICE })}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(128,128,128,0.2)', fontSize: '14px' }}>
              <span style={{ opacity: 0.6 }}>{t('landing.craftStripe')}</span>
              <span style={{ opacity: 0.6 }}>~0,47€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(128,128,128,0.2)', fontSize: '14px' }}>
              <span style={{ opacity: 0.6 }}>{t('landing.craftUrssaf')}</span>
              <span style={{ opacity: 0.6 }}>~4,79€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px', fontWeight: 600 }}>
              <span>{t('landing.craftDev')}</span>
              <span className="lp-link">~9,73€</span>
            </div>
            <p style={{ fontSize: '12px', opacity: 0.4, margin: '12px 0 0', lineHeight: 1.6 }}>
              {t('landing.craftDisclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="lp-cta-section">
        <h2>{t('landing.ctaFinalTitle')}</h2>
        <p>{t('landing.ctaFinalDesc')}</p>
        <Link to="/register" className="lp-btn-primary">{t('landing.ctaFinal')}</Link>
      </section>

    </div>
  );
};
