import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/landing.css';

const features = [
  { icon: '📊', title: 'KPIs en temps réel', desc: 'Taux de refus, taux de réponse, délai moyen. Comprends ce qui fonctionne dans ta recherche, chiffres à l\'appui.' },
  { icon: '🔔', title: 'File de relances',   desc: 'Ne laisse plus une candidature sans suite. OfferTrail te rappelle quand relancer et quel contact solliciter.' },
  { icon: '🏢', title: 'Score de probité',   desc: 'Chaque entreprise reçoit un signal basé sur les retours collectifs. Sache à quoi t\'attendre avant de postuler.' },
  { icon: '📋', title: 'Historique complet', desc: 'Chaque changement de statut est tracé. Retrouve l\'historique exact de chaque candidature, sans effort.' },
  { icon: '👥', title: 'Contacts centralisés', desc: 'Rattache tes recruteurs à leurs entreprises. Le réseau se construit candidature après candidature.' },
  { icon: '⚡', title: 'Démarrage immédiat', desc: 'Tu ouvres, tu ajoutes tes premières candidatures, et ton suivi prend forme tout de suite. Pas de setup lourd.' },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'OfferTrail — Pilote ta recherche d\'emploi';
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="lp-root">

      {/* ─── Hero ─── */}
      <section className="lp-hero">
        <div className="lp-badge">Pilotage clair · Tarif simple</div>
        <h1 className="lp-h1">
          Ta recherche d'emploi<br />
          <span>sans perdre le fil.</span>
        </h1>
        <p className="lp-hero-sub">
          Suis chaque candidature, mesure tes taux de réponse, ne rate plus aucune relance. Sans tableur.
        </p>
        <div className="lp-hero-actions">
          <Link to="/register" className="lp-btn-primary">Créer mon compte →</Link>
          <a href="#features" className="lp-btn-outline">Voir comment ça marche</a>
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
            <div className="lp-stat"><div className="lp-stat-num">43</div><div className="lp-stat-label">Candidatures suivies</div></div>
            <div className="lp-stat"><div className="lp-stat-num">69%</div><div className="lp-stat-label">Taux de refus</div></div>
            <div className="lp-stat"><div className="lp-stat-num">20.9%</div><div className="lp-stat-label">Taux de réponse</div></div>
            <div className="lp-stat"><div className="lp-stat-num">7 j</div><div className="lp-stat-label">Délai moyen de réponse</div></div>
          </div>
          <div className="lp-mock-body">
            <div className="lp-mock-grid">
              <div className="lp-panel">
                <p className="lp-panel-title">Pipeline actif</p>
                <div className="lp-pipeline">
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>Product Designer · FinTech Paris</strong>
                      <span className="lp-meta">Relance prévue demain · contact recruteur attaché</span>
                    </div>
                    <span className="lp-pill lp-pill-orange">Relance</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>UX Lead · Startup SaaS</strong>
                      <span className="lp-meta">Entretien prévu mercredi · notes centralisées</span>
                    </div>
                    <span className="lp-pill lp-pill-blue">Entretien</span>
                  </div>
                  <div className="lp-pipeline-item">
                    <div>
                      <strong>Senior Designer · ESN Lille</strong>
                      <span className="lp-meta">En attente · dernier contact il y a 5 jours</span>
                    </div>
                    <span className="lp-pill lp-pill-slate">En attente</span>
                  </div>
                </div>
              </div>
              <div className="lp-panel">
                <p className="lp-panel-title">Signaux clefs</p>
                <div className="lp-chart">
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>Taux de refus</span><span>69%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '69%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>Taux de réponse</span><span>20.9%</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '20.9%' }} /></div>
                  </div>
                  <div className="lp-bar-row">
                    <div className="lp-bar-meta"><span>Dossiers actifs</span><span>11</span></div>
                    <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: '26%' }} /></div>
                  </div>
                </div>
                <div className="lp-signal">
                  <strong>Point de friction détecté</strong>
                  <p>Les candidatures sans relance dans les 5 jours ont le moins bon taux de réponse.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="lp-section-wrap lp-alt">
        <div className="lp-section-inner">
          <div className="lp-section-kicker">Fonctionnalités</div>
          <h2 className="lp-section-title">Tout ce qu'il faut. Rien de superflu.</h2>
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
          <div className="lp-section-kicker">Tarif</div>
          <h2 className="lp-section-title">Simple. Transparent. Un seul plan.</h2>
          <div className="lp-pricing-grid">
            <div className="lp-pricing-copy">
              {[
                { title: 'Accès complet dès le départ', desc: 'Dashboard, relances, contacts, établissements, historique — rien n\'est verrouillé derrière un tier supérieur.' },
                { title: 'Sans engagement', desc: 'Résilie quand tu veux. Pas de contrat annuel forcé, pas de frais cachés à la sortie.' },
                { title: 'Un seul plan, sans ambiguïté', desc: 'OfferTrail fonctionne avec une offre Pro unique à 14,99 EUR par mois.' },
                { title: 'Suivi structuré', desc: 'Tes candidatures, contacts et historique restent centralisés dans un seul espace clair.' },
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
              <div className="lp-plan-name">Plan Pro</div>
              <div className="lp-plan-price">14,99 EUR <span className="lp-plan-period">/ mois</span></div>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                <li>Candidatures illimitées</li>
                <li>Dashboard complet avec KPIs réels</li>
                <li>Relances, historique et timeline</li>
                <li>Contacts et établissements liés</li>
                <li>Score de probité des entreprises</li>
                <li>Import TSV</li>
              </ul>
              <Link to="/register" className="lp-plan-cta">Créer mon compte →</Link>
              <p className="lp-plan-note">14,99 EUR / mois · Sans engagement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="lp-cta-section">
        <h2>Reprends le contrôle.</h2>
        <p>Un outil propre, un prix clair, une recherche mieux pilotée.</p>
        <Link to="/register" className="lp-btn-primary">Passer à OfferTrail →</Link>
      </section>

    </div>
  );
};
