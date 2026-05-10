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

      {/* ─── Made in France ─── */}
      <section className="lp-section-wrap lp-mif-section">
        <div className="lp-section-inner">
          <div className="lp-mif-layout">
            <div className="lp-mif-coq" aria-hidden="true">
              <svg viewBox="0 0 130 158" xmlns="http://www.w3.org/2000/svg">
                {/* Tail feathers — drawn behind body */}
                <path d="M 90 87 C 96 72 104 56 101 42 C 97 57 93 72 90 90 Z" fill="#002395"/>
                <path d="M 91 93 C 101 79 111 63 111 48 C 106 62 99 78 91 96 Z" fill="#FFFFFF" stroke="#ccc" strokeWidth="0.8"/>
                <path d="M 90 99 C 99 86 107 72 106 58 C 101 71 95 85 90 102 Z" fill="#ED2939"/>
                {/* Body */}
                <ellipse cx="62" cy="100" rx="30" ry="21" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8"/>
                {/* Wing */}
                <path d="M 36 96 C 43 80 76 80 83 92 C 68 87 44 87 36 96 Z" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6"/>
                {/* Neck */}
                <path d="M 35 56 C 30 65 35 77 45 82 C 53 78 57 67 54 57 C 49 62 42 62 35 56 Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.6"/>
                {/* Head */}
                <circle cx="45" cy="43" r="15" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8"/>
                {/* Comb — 3 peaks tricolores */}
                <path d="M 36 28 C 33 21 31 13 35 8 C 36 14 38 22 40 28 Z" fill="#002395"/>
                <path d="M 40 28 C 37 20 38 11 42 7 C 43 13 44 22 45 28 Z" fill="#FFFFFF" stroke="#ccc" strokeWidth="0.7"/>
                <path d="M 45 28 C 43 20 45 11 49 8 C 49 15 49 22 51 28 Z" fill="#ED2939"/>
                {/* Beak */}
                <path d="M 30 44 L 19 41 L 21 48 Z" fill="#F4A020"/>
                {/* Wattle */}
                <path d="M 27 50 C 22 53 19 58 21 62 C 22 66 27 65 28 61 C 29 57 28 52 27 50 Z" fill="#ED2939"/>
                {/* Eye */}
                <circle cx="39" cy="41" r="3.5" fill="#1A1A2E"/>
                <circle cx="38" cy="40" r="1.2" fill="white"/>
                {/* Legs */}
                <line x1="54" y1="121" x2="49" y2="143" stroke="#F4A020" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="70" y1="121" x2="75" y2="143" stroke="#F4A020" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Left toes */}
                <line x1="49" y1="143" x2="40" y2="148" stroke="#F4A020" strokeWidth="2" strokeLinecap="round"/>
                <line x1="49" y1="143" x2="49" y2="151" stroke="#F4A020" strokeWidth="2" strokeLinecap="round"/>
                <line x1="49" y1="143" x2="58" y2="147" stroke="#F4A020" strokeWidth="2" strokeLinecap="round"/>
                {/* Right toes */}
                <line x1="75" y1="143" x2="66" y2="148" stroke="#F4A020" strokeWidth="2" strokeLinecap="round"/>
                <line x1="75" y1="143" x2="75" y2="151" stroke="#F4A020" strokeWidth="2" strokeLinecap="round"/>
                <line x1="75" y1="143" x2="84" y2="147" stroke="#F4A020" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="lp-mif-text">
              <div className="lp-mif-tricolor">
                <span className="lp-mif-bar lp-mif-bar--blue" />
                <span className="lp-mif-bar lp-mif-bar--white" />
                <span className="lp-mif-bar lp-mif-bar--red" />
              </div>
              <div className="lp-section-kicker" style={{ textAlign: 'left', marginBottom: '10px' }}>
                {t('landing.mif.kicker')}
              </div>
              <h2 className="lp-mif-title">{t('landing.mif.title')}</h2>
              <p className="lp-mif-desc">{t('landing.mif.desc')}</p>
            </div>
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
