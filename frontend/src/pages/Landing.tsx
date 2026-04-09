import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LEGAL_CONFIG } from '../config/legal';

const styles = `
  /* ─── Reset & base ─────────────────────────────────────── */
  .l-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent),
      var(--bg-base);
  }

  /* ─── Nav ───────────────────────────────────────────────── */
  .l-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: color-mix(in srgb, var(--bg-base) 80%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  }

  .l-navInner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 32px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .l-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--text-main);
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: -0.02em;
    flex-shrink: 0;
  }

  .l-logoMark {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent-hover) 80%, white 20%) 100%);
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 900;
    color: white;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }

  .l-navCenter {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .l-navLink {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }

  .l-navLink:hover {
    color: var(--text-main);
    background: color-mix(in srgb, var(--bg-surface) 60%, transparent);
  }

  .l-navRight {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .l-btnOutline {
    padding: 7px 16px;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-main);
    text-decoration: none;
    border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
    background: transparent;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .l-btnOutline:hover {
    background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  }

  .l-btnPrimary {
    padding: 8px 18px;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 800;
    color: white;
    text-decoration: none;
    background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent-hover) 75%, white 25%) 100%);
    transition: opacity 0.15s, transform 0.15s;
    white-space: nowrap;
  }

  .l-btnPrimary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* ─── Hero ──────────────────────────────────────────────── */
  .l-hero {
    max-width: 820px;
    margin: 0 auto;
    padding: 96px 32px 80px;
    text-align: center;
  }

  .l-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin-bottom: 32px;
  }

  .l-h1 {
    font-size: clamp(2.6rem, 6vw, 4.4rem);
    line-height: 1.04;
    letter-spacing: -0.05em;
    margin: 0 0 24px;
    background: linear-gradient(
      160deg,
      var(--text-main) 40%,
      color-mix(in srgb, var(--text-main) 55%, var(--accent) 45%) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .l-sub {
    font-size: 1.15rem;
    color: var(--text-dim);
    max-width: 540px;
    margin: 0 auto 44px;
    line-height: 1.65;
  }

  .l-heroCtas {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .l-heroPrimary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 75%, white 25%));
    color: white;
    font-weight: 800;
    font-size: 1rem;
    text-decoration: none;
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .l-heroPrimary:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  .l-heroSecondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--bg-mantle) 90%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
    color: var(--text-main);
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: background 0.2s;
  }

  .l-heroSecondary:hover {
    background: color-mix(in srgb, var(--bg-surface) 80%, transparent);
  }

  /* ─── Features ──────────────────────────────────────────── */
  .l-features {
    max-width: 1120px;
    margin: 0 auto;
    padding: 80px 32px;
  }

  .l-sectionLabel {
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
  }

  .l-sectionTitle {
    text-align: center;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    letter-spacing: -0.04em;
    margin: 0 auto 56px;
    max-width: 560px;
  }

  .l-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .l-card {
    padding: 28px 28px 24px;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--border) 75%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 70%, transparent);
    transition: border-color 0.2s, background 0.2s;
  }

  .l-card:hover {
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 85%, transparent);
  }

  .l-cardIcon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    display: grid;
    place-items: center;
    margin-bottom: 16px;
  }

  .l-cardIcon svg {
    width: 20px;
    height: 20px;
    stroke: var(--accent);
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .l-cardTitle {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
  }

  .l-cardBody {
    font-size: 0.9rem;
    color: var(--text-dim);
    line-height: 1.6;
    margin: 0;
  }

  /* ─── Pricing ───────────────────────────────────────────── */
  .l-pricing {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 32px 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .l-pricingCard {
    width: min(460px, 100%);
    padding: 36px 32px;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 8%, transparent), transparent 55%),
      color-mix(in srgb, var(--bg-mantle) 80%, transparent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--accent) 15%, transparent),
      0 24px 60px color-mix(in srgb, var(--accent) 8%, transparent);
  }

  .l-pricingTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .l-pricingPlan {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin: 0 0 8px;
  }

  .l-pricingAmount {
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.05em;
    line-height: 1;
    margin: 0;
  }

  .l-pricingPeriod {
    font-size: 15px;
    font-weight: 400;
    color: var(--text-dim);
    margin-left: 4px;
  }

  .l-pricingChip {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent);
    white-space: nowrap;
    margin-top: 4px;
  }

  .l-pricingDivider {
    height: 1px;
    background: color-mix(in srgb, var(--border) 60%, transparent);
    margin: 20px 0;
  }

  .l-pricingFeatures {
    list-style: none;
    padding: 0;
    margin: 0 0 28px;
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .l-pricingFeature {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.92rem;
    color: var(--text-dim);
  }

  .l-pricingCheck {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: color-mix(in srgb, #22c55e 15%, transparent);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .l-pricingCheck svg {
    width: 10px;
    height: 10px;
    stroke: #86efac;
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .l-pricingCta {
    display: block;
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-hover) 75%, white 25%));
    color: white;
    font-weight: 800;
    font-size: 1rem;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .l-pricingCta:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .l-pricingNote {
    margin-top: 16px;
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
  }

  /* ─── CTA Banner ────────────────────────────────────────── */
  .l-ctaBanner {
    border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
    background: color-mix(in srgb, var(--bg-mantle) 50%, transparent);
  }

  .l-ctaBannerInner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 72px 32px;
    text-align: center;
  }

  .l-ctaBannerTitle {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    letter-spacing: -0.04em;
    margin: 0 0 16px;
  }

  .l-ctaBannerSub {
    font-size: 1rem;
    color: var(--text-dim);
    margin: 0 auto 36px;
    max-width: 420px;
  }

  /* ─── Footer ────────────────────────────────────────────── */
  .l-footer {
    border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    background: color-mix(in srgb, var(--bg-crust) 40%, transparent);
  }

  .l-footerInner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .l-footerLeft {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .l-footerCopy {
    font-size: 0.82rem;
    color: var(--text-dim);
  }

  .l-footerLinks {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .l-footerLink {
    font-size: 0.82rem;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.15s;
  }

  .l-footerLink:hover {
    color: var(--text-main);
  }

  .l-footerSep {
    color: color-mix(in srgb, var(--border) 80%, transparent);
    font-size: 0.82rem;
  }

  /* ─── Responsive ─────────────────────────────────────────── */
  @media (max-width: 720px) {
    .l-navCenter { display: none; }
    .l-grid { grid-template-columns: 1fr; }
    .l-hero { padding: 64px 20px 56px; }
    .l-features, .l-pricing { padding-left: 20px; padding-right: 20px; }
    .l-ctaBannerInner { padding: 56px 20px; }
    .l-footerInner { flex-direction: column; align-items: flex-start; }
  }
`;

const FEATURES = [
  {
    title: 'Pipeline visuel',
    body: 'Chaque candidature avance à travers un pipeline clair. Un statut, une action. Repérez immédiatement ce qui est en attente ou ce qui ghoste.',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="18" rx="2" /><rect x="14" y="3" width="7" height="11" rx="2" /></svg>
    ),
  },
  {
    title: 'Contacts & entreprises',
    body: 'Chaque candidature liée à son interlocuteur et son entreprise. Le contexte, les notes et l\'historique toujours à portée de main.',
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" /></svg>
    ),
  },
  {
    title: 'Relances',
    body: 'Identifiez les opportunités qui méritent une relance. Ne laissez plus une candidature prometteuse s\'éteindre faute de suivi.',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
    ),
  },
  {
    title: 'Analytics',
    body: 'Mesurez votre taux de réponse, identifiez vos meilleures sources et affinez votre stratégie avec des données concrètes.',
    icon: (
      <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    ),
  },
];

const PRO_FEATURES = [
  'Candidatures illimitées',
  'Pipeline & statuts',
  'Contacts & entreprises',
  'Analytics complets',
  'Import TSV',
  'Relances',
];

export function Landing() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'OfferTrail — CRM de candidatures';
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="l-root">

        {/* ── Nav ── */}
        <nav className="l-nav">
          <div className="l-navInner">
            <Link to="/" className="l-logo">
              <span className="l-logoMark">OT</span>
              OfferTrail
            </Link>
            <div className="l-navCenter">
              <a href="#fonctionnalites" className="l-navLink">Fonctionnalités</a>
              <a href="#tarifs" className="l-navLink">Tarifs</a>
            </div>
            <div className="l-navRight">
              <Link to="/login" className="l-btnOutline">Se connecter</Link>
              <Link to="/register" className="l-btnPrimary">Commencer →</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="l-hero">
          <div className="l-badge">CRM de candidatures</div>
          <h1 className="l-h1">
            Gérez votre recherche d'emploi<br />avec la rigueur d'un commercial.
          </h1>
          <p className="l-sub">
            OfferTrail centralise vos candidatures, vos contacts et vos relances dans un pipeline clair. Finissez-en avec les tableurs.
          </p>
          <div className="l-heroCtas">
            <Link to="/register" className="l-heroPrimary">
              Commencer maintenant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <a href="#tarifs" className="l-heroSecondary">Voir les tarifs</a>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="l-features" id="fonctionnalites">
          <p className="l-sectionLabel">Fonctionnalités</p>
          <h2 className="l-sectionTitle">Tout ce qu'il vous faut pour rester en contrôle.</h2>
          <div className="l-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="l-card">
                <div className="l-cardIcon">{f.icon}</div>
                <h3 className="l-cardTitle">{f.title}</h3>
                <p className="l-cardBody">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="l-pricing" id="tarifs">
          <p className="l-sectionLabel">Tarification</p>
          <h2 className="l-sectionTitle" style={{ marginBottom: 40 }}>Un seul plan. Tout inclus.</h2>
          <div className="l-pricingCard">
            <div className="l-pricingTop">
              <div>
                <p className="l-pricingPlan">Pro</p>
                <p className="l-pricingAmount">9,99€<span className="l-pricingPeriod">/mois</span></p>
              </div>
              <span className="l-pricingChip">Tout inclus</span>
            </div>
            <div className="l-pricingDivider" />
            <ul className="l-pricingFeatures">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="l-pricingFeature">
                  <span className="l-pricingCheck">
                    <svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/register" className="l-pricingCta">Commencer maintenant</Link>
            <p className="l-pricingNote">Paiement simulé en local · Mollie sera intégré prochainement</p>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="l-ctaBanner">
          <div className="l-ctaBannerInner">
            <h2 className="l-ctaBannerTitle">Prêt à reprendre le contrôle ?</h2>
            <p className="l-ctaBannerSub">Rejoignez OfferTrail et donnez une structure à votre recherche d'emploi.</p>
            <Link to="/register" className="l-heroPrimary" style={{ display: 'inline-flex' }}>
              Créer un compte
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="l-footer">
          <div className="l-footerInner">
            <div className="l-footerLeft">
              <span className="l-footerCopy">© {new Date().getFullYear()} {LEGAL_CONFIG.company.name} — {LEGAL_CONFIG.productName}</span>
            </div>
            <div className="l-footerLinks">
              <a href="#tarifs" className="l-footerLink">Tarifs</a>
              <span className="l-footerSep">·</span>
              <Link to="/cgv" className="l-footerLink">CGV</Link>
              <span className="l-footerSep">·</span>
              <Link to="/mentions-legales" className="l-footerLink">Mentions légales</Link>
              <span className="l-footerSep">·</span>
              <Link to="/rgpd" className="l-footerLink">RGPD</Link>
              <span className="l-footerSep">·</span>
              <a href={`mailto:${LEGAL_CONFIG.company.email}`} className="l-footerLink">Contact</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
