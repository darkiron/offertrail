import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { PlanCard } from '../components/PlanCard';
import { usePricingPlans } from '../lib/pricingPlans';
import type { BillingPeriod } from '../lib/pricingPlans';
import '../styles/landing.css';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const plans = usePricingPlans();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'ultimate' | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  const features = [
    { icon: '📊', title: t('landing.features.kpi_title'),      desc: t('landing.features.kpi_desc') },
    { icon: '🔔', title: t('landing.features.followup_title'), desc: t('landing.features.followup_desc') },
    { icon: '🏢', title: t('landing.features.probity_title'),  desc: t('landing.features.probity_desc') },
    { icon: '📋', title: t('landing.features.history_title'),  desc: t('landing.features.history_desc') },
    { icon: '👥', title: t('landing.features.contacts_title'), desc: t('landing.features.contacts_desc') },
    { icon: '⚡', title: t('landing.features.start_title'),    desc: t('landing.features.start_desc') },
  ];

  useEffect(() => {
    document.title = t('landing.hero.pageTitle');
  }, [t]);

  const handlePricingCta = (id: 'free' | 'pro' | 'ultimate', selectedPeriod: BillingPeriod) => {
    const params = new URLSearchParams({ plan: id, period: selectedPeriod });
    navigate(`/register?${params.toString()}`);
  };

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
            <div className="lp-stat"><div className="lp-stat-num">{t('landing.mock.trackedValue')}</div><div className="lp-stat-label">{t('landing.mock.trackedLabel')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">{t('landing.mock.followupsValue')}</div><div className="lp-stat-label">{t('landing.mock.followupsLabel')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">{t('landing.mock.historyValue')}</div><div className="lp-stat-label">{t('landing.mock.historyLabel')}</div></div>
            <div className="lp-stat"><div className="lp-stat-num">{t('landing.mock.networkValue')}</div><div className="lp-stat-label">{t('landing.mock.networkLabel')}</div></div>
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
                <div className="lp-signal-list">
                  <p>{t('landing.mock.signal1')}</p>
                  <p>{t('landing.mock.signal2')}</p>
                  <p>{t('landing.mock.signal3')}</p>
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
          <div className="lp-section-kicker">{t('landing.pricing.pageKicker')}</div>
          <h2 className="lp-section-title">{t('landing.pricing.landingTitle')}</h2>
          <p className="lp-section-sub">{t('landing.pricing.landingSub')}</p>
          <div className="lp-pricing-controls">
            <span>{t('landing.pricing.periodLabel')}</span>
            <div className="lp-segmented" role="group" aria-label={t('landing.pricing.periodLabel')}>
              {(['monthly', 'yearly'] as BillingPeriod[]).map((value) => <button type="button" key={value} className={period === value ? 'is-active' : ''} onClick={() => setPeriod(value)}>{t(`landing.pricing.${value}`)}</button>)}
            </div>
            {period === 'yearly' && <strong>{t('landing.pricing.savingsBadge')}</strong>}
          </div>
          <div className="lp-pricing-grid lp-pricing-grid-three lp-plan-card-grid">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                period={period}
                onSelect={setSelectedPlan}
                onCta={handlePricingCta}
                mode="public"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="lp-section-wrap lp-alt" id="faq">
        <div className="lp-section-inner lp-faq">
          <div className="lp-section-kicker">{t('landing.faq.kicker')}</div>
          <h2 className="lp-section-title">{t('landing.faq.title')}</h2>
          <div className="lp-faq-list">
            {(['1', '2', '3', '4', '5'] as const).map((number) => (
              <details className="lp-faq-item" key={number}>
                <summary>{t(`landing.faq.q${number}`)}</summary>
                <p>{t(`landing.faq.a${number}`)}</p>
              </details>
            ))}
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
            <p style={{ fontSize: '14px', lineHeight: 1.7, margin: 0, opacity: 0.75 }}>
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
