import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import classes from './HomePage.module.css';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Pipeline en temps réel',
    desc: 'Retrouve instantanément ce qui est en attente, ce qui ghoste et ce qui nécessite une relance.',
  },
  {
    icon: '🏢',
    title: 'Contexte entreprise complet',
    desc: 'Score de probité, historique des interactions et contacts rattachés à chaque candidature.',
  },
  {
    icon: '🔔',
    title: 'Relances intelligentes',
    desc: "Ne laisse plus passer une opportunité. Suis tes relances avec des rappels contextuels.",
  },
  {
    icon: '📊',
    title: 'Analytics',
    desc: 'Visualise ton taux de réponse, tes points de blocage et tes leviers d’amélioration.',
  },
  {
    icon: '📇',
    title: 'CRM candidature',
    desc: 'Un espace structuré pour chaque offre : poste, salaire, recruteur, notes et timeline.',
  },
  {
    icon: '☁️',
    title: 'Accès partout',
    desc: "Tes données sont synchronisées et accessibles depuis n'importe quel appareil, à tout moment.",
  },
];

const PLANS = [
  {
    name: 'Free',
    badge: 'Pour démarrer',
    monthly: '0€',
    yearly: '—',
    desc: 'Le nécessaire pour tester OfferTrail sur une recherche légère.',
    features: ['5 candidatures', 'Historique 1 mois', '1 relance active', 'Dashboard basique'],
  },
  {
    name: 'Pro',
    badge: 'Populaire',
    monthly: '9,99€',
    yearly: '99€/an',
    desc: "Pour piloter une recherche active sans perdre le fil.",
    featured: true,
    features: ['100 candidatures', 'Historique 6 mois', '10 relances actives', 'Import/Export CSV'],
  },
  {
    name: 'Ultimate',
    badge: 'Meilleur rapport annuel',
    monthly: '14,99€',
    yearly: '149€/an',
    desc: 'Pour lever toutes les limites et garder tout ton historique.',
    features: ['Candidatures illimitées', 'Historique illimité', 'Relances illimitées', 'Support prioritaire'],
  },
];

export function HomePage() {
  useEffect(() => {
    document.title = 'OfferTrail — Reprends la main sur ton pipeline';
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className={classes.hero}>
        <span className={classes.eyebrow}>🚀 CRM de candidatures</span>

        <h1 className={classes.heroTitle}>
          Reprends la main sur<br />
          <em>ton pipeline de candidatures.</em>
        </h1>

        <p className={classes.heroSub}>
          OfferTrail centralise toutes tes offres, relances, entreprises et contacts dans un
          espace structuré comme un CRM — conçu pour les candidats sérieux.
        </p>

        <div className={classes.heroCta}>
          <Link to="/register" className={classes.btnHeroPrimary}>
            Démarrer maintenant →
          </Link>
          <a href="#fonctionnalites" className={classes.btnHeroOutline}>
            Voir les fonctionnalités
          </a>
        </div>

        <p className={classes.proof}>
          <span className={classes.proofDot} />
          Free disponible · Pro 9,99€/mois ou 99€/an · Ultimate 149€/an
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
          <div className={classes.sectionEyebrow}>💳 Tarifs</div>
          <h2 className={classes.sectionTitle}>Trois plans, mensuel ou annuel</h2>
          <p className={classes.sectionSub}>Choisis selon ton volume de candidatures. Le plan annuel est disponible sur Pro et Ultimate.</p>
        </div>
        <div className={classes.pricingGrid}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`${classes.planCard} ${plan.featured ? classes.featured : ''}`}>
              <div className={classes.planHeader}>
                <span className={classes.planBadge}>{plan.name}</span>
                <span className={classes.planTag}>{plan.badge}</span>
              </div>
              <h3 className={classes.planName}>{plan.desc}</h3>
              <div className={classes.planPrice}>
                {plan.monthly}<span className={classes.planPeriod}>/mois</span>
              </div>
              <p className={classes.planDesc}>{plan.yearly === '—' ? 'Pas de facturation annuelle' : `${plan.yearly} en annuel`}</p>
              <ul className={classes.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className={classes.checkmark}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`${classes.planCta} ${plan.featured ? classes.primary : ''}`}>
                {plan.name === 'Free' ? 'Créer un compte' : 'Essayer 30 jours'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className={classes.ctaSection}>
        <div className={classes.ctaInner}>
          <h2 className={classes.ctaTitle}>Prêt à structurer ta recherche ?</h2>
          <p className={classes.ctaSub}>Rejoins OfferTrail gratuitement, puis passe en Pro ou Ultimate quand tu en as besoin.</p>
          <Link to="/register" className={classes.btnHeroPrimary}>
            Créer mon compte →
          </Link>
        </div>
      </section>
    </>
  );
}
