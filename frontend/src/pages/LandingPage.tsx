import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const landingStyles = `
  .landing-root {
    min-height: 100vh;
    background: var(--bg-base);
    color: var(--text-main);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  /* ─── Nav ─── */
  .landing-nav-wrap {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(16px);
    background: color-mix(in srgb, var(--bg-base) 85%, transparent 15%);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent 20%);
  }

  .landing-nav {
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .landing-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: .04em;
    text-decoration: none;
    color: var(--text-main);
  }

  .landing-brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .landing-nav-links {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .landing-nav-ghost {
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 999px;
    transition: color .15s, background .15s;
  }

  .landing-nav-ghost:hover {
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-surface) 60%, transparent);
  }

  .landing-nav-cta {
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    color: white;
    font-weight: 700;
    font-size: 14px;
    padding: 8px 20px;
    border-radius: 999px;
    text-decoration: none;
    transition: opacity .15s;
  }

  .landing-nav-cta:hover { opacity: .88; }

  /* ─── Hero ─── */
  .landing-hero {
    max-width: 780px;
    margin: 0 auto;
    padding: 88px 24px 64px;
    text-align: center;
  }

  .landing-badge {
    display: inline-block;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
    border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
    font-size: 12px;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 999px;
    margin-bottom: 24px;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .landing-h1 {
    font-size: clamp(32px, 5vw, 54px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -.03em;
    margin-bottom: 20px;
  }

  .landing-h1 span { color: #38bdf8; }

  .landing-hero-sub {
    font-size: 18px;
    color: var(--text-dim);
    max-width: 520px;
    margin: 0 auto 40px;
    line-height: 1.65;
  }

  .landing-hero-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .landing-btn-primary {
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    color: white;
    font-weight: 700;
    font-size: 15px;
    padding: 14px 28px;
    border-radius: 999px;
    text-decoration: none;
    transition: opacity .15s, transform .15s;
    display: inline-block;
  }

  .landing-btn-primary:hover { opacity: .88; transform: translateY(-1px); }

  .landing-btn-outline {
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    transition: color .15s, background .15s;
  }

  .landing-btn-outline:hover {
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-surface) 50%, transparent);
  }

  /* ─── Mockup ─── */
  .landing-mockup-wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 0 24px 88px;
  }

  .landing-mockup-frame {
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    background: var(--bg-mantle);
    overflow: hidden;
    box-shadow: 0 40px 80px rgba(0,0,0,0.28), 0 0 0 1px color-mix(in srgb, var(--border) 60%, transparent);
  }

  .landing-mockup-bar {
    background: var(--bg-crust);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  }

  .landing-dot { width: 10px; height: 10px; border-radius: 50%; }
  .landing-dot-red { background: #ff5f57; }
  .landing-dot-yellow { background: #febc2e; }
  .landing-dot-green { background: #28c840; }

  .landing-url-bar {
    flex: 1;
    text-align: center;
    background: color-mix(in srgb, var(--bg-base) 80%, transparent);
    border-radius: 6px;
    padding: 4px 14px;
    font-size: 12px;
    color: var(--text-dim);
    max-width: 280px;
    margin: 0 auto;
  }

  .landing-stats-row {
    display: flex;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
    padding: 18px 24px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  }

  .landing-stat { text-align: center; }
  .landing-stat-num { font-size: 28px; font-weight: 800; color: #38bdf8; }
  .landing-stat-label { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

  .landing-mock-body {
    padding: 24px;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, #38bdf8 12%, transparent), transparent 30%),
      linear-gradient(180deg, color-mix(in srgb, var(--bg-surface) 10%, transparent), transparent);
  }

  .landing-mock-grid {
    display: grid;
    grid-template-columns: 1.3fr .9fr;
    gap: 16px;
  }

  .landing-panel {
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--bg-crust) 72%, transparent);
    padding: 18px;
  }

  .landing-panel-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--text-dim);
    font-weight: 700;
    margin-bottom: 14px;
  }

  .landing-pipeline {
    display: grid;
    gap: 10px;
  }

  .landing-pipeline-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--bg-surface) 40%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  }

  .landing-pipeline-item strong {
    display: block;
    font-size: 13px;
    margin-bottom: 2px;
  }

  .landing-pipeline-item span.meta {
    font-size: 12px;
    color: var(--text-dim);
  }

  .landing-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 5px 10px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: .04em;
    white-space: nowrap;
  }

  .landing-pill-orange { background: rgba(245,158,11,0.14); color: #fbbf24; border: 1px solid rgba(245,158,11,0.22); }
  .landing-pill-blue   { background: rgba(59,130,246,0.14);  color: #93c5fd; border: 1px solid rgba(59,130,246,0.22); }
  .landing-pill-slate  { background: rgba(148,163,184,0.12); color: #cbd5e1; border: 1px solid rgba(148,163,184,0.18); }

  .landing-chart { display: grid; gap: 14px; }
  .landing-bar-row { display: grid; gap: 7px; }
  .landing-bar-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); }
  .landing-bar-track {
    height: 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--border) 60%, transparent);
    overflow: hidden;
  }
  .landing-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #38bdf8, #2563eb);
  }

  .landing-signal {
    margin-top: 14px;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, #38bdf8 20%, transparent);
    background: color-mix(in srgb, #38bdf8 8%, transparent);
  }

  .landing-signal strong {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .landing-signal p {
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.55;
  }

  /* ─── Features ─── */
  .landing-features-section {
    border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 50%, transparent);
  }

  .landing-features {
    max-width: 980px;
    margin: 0 auto;
    padding: 80px 24px;
  }

  .landing-section-label {
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 14px;
  }

  .landing-section-title {
    text-align: center;
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 900;
    letter-spacing: -.03em;
    margin-bottom: 48px;
  }

  .landing-feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  .landing-feature {
    background: var(--bg-mantle);
    border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    border-radius: 18px;
    padding: 26px 22px;
    transition: border-color .2s, transform .2s, box-shadow .2s;
  }

  .landing-feature:hover {
    border-color: color-mix(in srgb, #38bdf8 36%, transparent);
    transform: translateY(-3px);
    box-shadow: 0 18px 40px rgba(0,0,0,0.18);
  }

  .landing-feature-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: color-mix(in srgb, #38bdf8 12%, transparent);
    border: 1px solid color-mix(in srgb, #38bdf8 20%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 16px;
    color: #38bdf8;
  }

  .landing-feature h3 { font-size: 15px; font-weight: 800; margin-bottom: 8px; }
  .landing-feature p { font-size: 13px; color: var(--text-dim); line-height: 1.65; }

  /* ─── Pricing ─── */
  .landing-pricing-section {
    border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  }

  .landing-pricing {
    max-width: 920px;
    margin: 0 auto;
    padding: 80px 24px;
  }

  .landing-pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
    margin-top: 48px;
  }

  .landing-pricing-copy {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-top: 8px;
  }

  .landing-pricing-point {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .landing-pricing-check {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: color-mix(in srgb, #38bdf8 16%, transparent);
    border: 1px solid color-mix(in srgb, #38bdf8 30%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #38bdf8;
    font-weight: 900;
    margin-top: 2px;
  }

  .landing-pricing-point-title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 3px;
  }

  .landing-pricing-point-desc {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.55;
  }

  .landing-plan-card {
    background: linear-gradient(145deg,
      color-mix(in srgb, #38bdf8 12%, var(--bg-mantle)),
      color-mix(in srgb, #2563eb 8%, var(--bg-crust))
    );
    border: 1px solid color-mix(in srgb, #38bdf8 36%, transparent);
    border-radius: 22px;
    padding: 30px;
    box-shadow: 0 28px 56px rgba(0,0,0,0.22), 0 0 0 1px color-mix(in srgb, #38bdf8 18%, transparent) inset;
  }

  .landing-plan-name {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-dim);
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .landing-plan-price {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -.03em;
    line-height: 1;
    margin-bottom: 4px;
  }

  .landing-plan-period {
    font-size: 14px;
    font-weight: 400;
    color: var(--text-dim);
  }

  .landing-plan-hint {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 22px;
    line-height: 1.5;
  }

  .landing-plan-divider {
    height: 1px;
    background: color-mix(in srgb, var(--border) 60%, transparent);
    margin: 18px 0;
  }

  .landing-plan-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
  }

  .landing-plan-features li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .landing-plan-features li::before {
    content: "+";
    color: #38bdf8;
    font-weight: 900;
    font-size: 14px;
    flex-shrink: 0;
  }

  .landing-plan-cta {
    display: block;
    width: 100%;
    text-align: center;
    background: linear-gradient(135deg, #38bdf8, #2563eb);
    color: white;
    font-weight: 800;
    font-size: 15px;
    padding: 14px;
    border-radius: 14px;
    text-decoration: none;
    transition: opacity .15s;
  }

  .landing-plan-cta:hover { opacity: .88; }

  .landing-plan-note {
    text-align: center;
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 12px;
  }

  /* ─── CTA final ─── */
  .landing-cta-section {
    text-align: center;
    padding: 88px 24px;
    background: linear-gradient(180deg, transparent, color-mix(in srgb, #38bdf8 4%, transparent));
    border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  }

  .landing-cta-section h2 {
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 900;
    letter-spacing: -.03em;
    margin-bottom: 14px;
  }

  .landing-cta-section p {
    color: var(--text-dim);
    margin-bottom: 36px;
    font-size: 16px;
  }

  /* ─── Footer ─── */
  .landing-footer {
    border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    background: color-mix(in srgb, var(--bg-crust) 80%, transparent);
    padding: 40px 24px;
  }

  .landing-footer-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 32px;
    align-items: start;
  }

  .landing-footer-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: var(--text-main);
    font-weight: 800;
    margin-bottom: 8px;
  }

  .landing-footer-tagline {
    font-size: 13px;
    color: var(--text-dim);
    max-width: 280px;
    line-height: 1.55;
    margin-bottom: 16px;
  }

  .landing-footer-copy {
    font-size: 12px;
    color: var(--text-dim);
  }

  .landing-footer-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }

  .landing-footer-links a, .landing-footer-links button {
    font-size: 13px;
    color: var(--text-dim);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color .15s;
  }

  .landing-footer-links a:hover, .landing-footer-links button:hover { color: var(--text-main); }

  .landing-footer-divider {
    width: 1px;
    height: 100%;
    background: color-mix(in srgb, var(--border) 60%, transparent);
  }

  /* ─── Responsive ─── */
  @media (max-width: 860px) {
    .landing-mock-grid { grid-template-columns: 1fr; }
    .landing-feature-grid { grid-template-columns: 1fr 1fr; }
    .landing-pricing-grid { grid-template-columns: 1fr; }
    .landing-footer-inner { grid-template-columns: 1fr; }
    .landing-footer-links { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
  }

  @media (max-width: 560px) {
    .landing-feature-grid { grid-template-columns: 1fr; }
    .landing-stats-row { gap: 20px; }
  }
`;

const features = [
  {
    icon: '📊',
    title: 'KPIs en temps réel',
    desc: 'Taux de refus, taux de réponse, délai moyen. Comprends ce qui fonctionne dans ta recherche, chiffres à l\'appui.',
  },
  {
    icon: '🔔',
    title: 'File de relances',
    desc: 'Ne laisse plus une candidature sans suite. OfferTrail te rappelle quand relancer et quel contact solliciter.',
  },
  {
    icon: '🏢',
    title: 'Score de probité',
    desc: 'Chaque entreprise reçoit un signal basé sur les retours collectifs. Sache à quoi t\'attendre avant de postuler.',
  },
  {
    icon: '📋',
    title: 'Historique complet',
    desc: 'Chaque changement de statut est tracé. Retrouve l\'historique exact de chaque candidature, sans effort.',
  },
  {
    icon: '👥',
    title: 'Contacts centralisés',
    desc: 'Rattache tes recruteurs à leurs entreprises. Le réseau se construit candidature après candidature.',
  },
  {
    icon: '⚡',
    title: 'Démarrage immédiat',
    desc: 'Tu ouvres, tu ajoutes tes premières candidatures, et ton suivi prend forme tout de suite. Pas de setup lourd.',
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'OfferTrail — Pilote ta recherche d\'emploi';
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="landing-root">
      <style>{landingStyles}</style>

      {/* ─── Nav ─── */}
      <div className="landing-nav-wrap" style={{ boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.18)' : 'none' }}>
        <nav className="landing-nav">
          <Link to="/" className="landing-brand">
            <div className="landing-brand-mark">OT</div>
            OfferTrail
          </Link>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-ghost">Connexion</Link>
            <Link to="/register" className="landing-nav-cta">Créer mon compte</Link>
          </div>
        </nav>
      </div>

      {/* ─── Hero ─── */}
      <section className="landing-hero">
        <div className="landing-badge">Pilotage clair · Tarif simple</div>
        <h1 className="landing-h1">
          Ta recherche d'emploi<br />
          <span>sans perdre le fil.</span>
        </h1>
        <p className="landing-hero-sub">
          Suis chaque candidature, mesure tes taux de réponse, ne rate plus aucune relance. Sans tableur.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="landing-btn-primary">
            Créer mon compte →
          </Link>
          <a href="#features" className="landing-btn-outline">
            Voir comment ça marche
          </a>
        </div>
      </section>

      {/* ─── Dashboard mockup ─── */}
      <div className="landing-mockup-wrap">
        <div className="landing-mockup-frame">
          <div className="landing-mockup-bar">
            <div className="landing-dot landing-dot-red" />
            <div className="landing-dot landing-dot-yellow" />
            <div className="landing-dot landing-dot-green" />
            <div className="landing-url-bar">app.offertrail.fr/app</div>
          </div>
          <div className="landing-stats-row">
            <div className="landing-stat">
              <div className="landing-stat-num">43</div>
              <div className="landing-stat-label">Candidatures suivies</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">69%</div>
              <div className="landing-stat-label">Taux de refus</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">20.9%</div>
              <div className="landing-stat-label">Taux de réponse</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">7 j</div>
              <div className="landing-stat-label">Délai moyen de réponse</div>
            </div>
          </div>
          <div className="landing-mock-body">
            <div className="landing-mock-grid">
              <div className="landing-panel">
                <p className="landing-panel-title">Pipeline actif</p>
                <div className="landing-pipeline">
                  <div className="landing-pipeline-item">
                    <div>
                      <strong>Product Designer · FinTech Paris</strong>
                      <span className="meta">Relance prévue demain · contact recruteur attaché</span>
                    </div>
                    <span className="landing-pill landing-pill-orange">Relance</span>
                  </div>
                  <div className="landing-pipeline-item">
                    <div>
                      <strong>UX Lead · Startup SaaS</strong>
                      <span className="meta">Entretien prévu mercredi · notes centralisées</span>
                    </div>
                    <span className="landing-pill landing-pill-blue">Entretien</span>
                  </div>
                  <div className="landing-pipeline-item">
                    <div>
                      <strong>Senior Designer · ESN Lille</strong>
                      <span className="meta">En attente · dernier contact il y a 5 jours</span>
                    </div>
                    <span className="landing-pill landing-pill-slate">En attente</span>
                  </div>
                </div>
              </div>
              <div className="landing-panel">
                <p className="landing-panel-title">Signaux clefs</p>
                <div className="landing-chart">
                  <div className="landing-bar-row">
                    <div className="landing-bar-meta"><span>Taux de refus</span><span>69%</span></div>
                    <div className="landing-bar-track"><div className="landing-bar-fill" style={{ width: '69%' }} /></div>
                  </div>
                  <div className="landing-bar-row">
                    <div className="landing-bar-meta"><span>Taux de réponse</span><span>20.9%</span></div>
                    <div className="landing-bar-track"><div className="landing-bar-fill" style={{ width: '20.9%' }} /></div>
                  </div>
                  <div className="landing-bar-row">
                    <div className="landing-bar-meta"><span>Dossiers actifs</span><span>11</span></div>
                    <div className="landing-bar-track"><div className="landing-bar-fill" style={{ width: '26%' }} /></div>
                  </div>
                </div>
                <div className="landing-signal">
                  <strong>Point de friction détecté</strong>
                  <p>Les candidatures sans relance dans les 5 jours ont le moins bon taux de réponse. Tu le vois tout de suite.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="landing-features-section">
        <div className="landing-features">
          <div className="landing-section-label">Fonctionnalités</div>
          <h2 className="landing-section-title">Tout ce qu'il faut. Rien de superflu.</h2>
          <div className="landing-feature-grid">
            {features.map((f) => (
              <div key={f.title} className="landing-feature">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="landing-pricing-section">
        <div className="landing-pricing">
          <div className="landing-section-label">Tarif</div>
          <h2 className="landing-section-title">Simple. Transparent. Un seul plan.</h2>

          <div className="landing-pricing-grid">
            <div className="landing-pricing-copy">
              <div className="landing-pricing-point">
                <div className="landing-pricing-check">✓</div>
                <div>
                  <div className="landing-pricing-point-title">Accès complet dès le départ</div>
                  <div className="landing-pricing-point-desc">Dashboard, relances, contacts, établissements, historique — rien n'est bloqué derrière un tier supérieur.</div>
                </div>
              </div>
              <div className="landing-pricing-point">
                <div className="landing-pricing-check">✓</div>
                <div>
                  <div className="landing-pricing-point-title">Sans engagement</div>
                  <div className="landing-pricing-point-desc">Résilie quand tu veux. Pas de contrat annuel forcé, pas de frais cachés à la sortie.</div>
                </div>
              </div>
              <div className="landing-pricing-point">
                <div className="landing-pricing-check">✓</div>
                <div>
                  <div className="landing-pricing-point-title">Plan Starter gratuit pour commencer</div>
                  <div className="landing-pricing-point-desc">Crée ton compte gratuitement et ajoute tes premières candidatures avant de passer Pro.</div>
                </div>
              </div>
              <div className="landing-pricing-point">
                <div className="landing-pricing-check">✓</div>
                <div>
                  <div className="landing-pricing-point-title">Données qui t'appartiennent</div>
                  <div className="landing-pricing-point-desc">Tes candidatures, tes contacts, ton historique — tes données restent les tiennes, accessibles et exportables.</div>
                </div>
              </div>
            </div>

            <div className="landing-plan-card">
              <div className="landing-plan-name">Plan Pro</div>
              <div className="landing-plan-price">
                9,99 EUR <span className="landing-plan-period">/ mois</span>
              </div>
              <div className="landing-plan-divider" />
              <ul className="landing-plan-features">
                <li>Candidatures illimitées</li>
                <li>Dashboard complet avec KPIs réels</li>
                <li>Relances, historique et timeline</li>
                <li>Contacts et établissements liés</li>
                <li>Score de probité des entreprises</li>
                <li>Import TSV / export des données</li>
              </ul>
              <Link to="/register" className="landing-plan-cta">
                Commencer gratuitement →
              </Link>
              <p className="landing-plan-note">Plan Starter gratuit inclus · Pas de CB requise pour démarrer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="landing-cta-section">
        <h2>Reprends le contrôle.</h2>
        <p>Un outil propre, un prix clair, une recherche mieux pilotée.</p>
        <Link to="/register" className="landing-btn-primary">
          Passer à OfferTrail →
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div>
            <Link to="/" className="landing-footer-brand">
              <div className="landing-brand-mark" style={{ width: 28, height: 28, fontSize: 12 }}>OT</div>
              OfferTrail
            </Link>
            <p className="landing-footer-tagline">
              Pilote ta recherche d'emploi avec des données claires. Candidatures, relances, contacts — tout au même endroit.
            </p>
            <p className="landing-footer-copy">© {new Date().getFullYear()} OfferTrail · Tous droits réservés</p>
          </div>

          <div className="landing-footer-links">
            <Link to="/app">Accéder à l'app</Link>
            <Link to="/legal">Mentions légales</Link>
            <Link to="/cgv">CGV</Link>
            <Link to="/confidentialite">Politique de confidentialité</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
