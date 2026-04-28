Tu dois intégrer la marque CraftCodes et la transparence sur les prix dans OfferTrail.
Lis landing/index.html, frontend/src/pages/Pricing.tsx (ou équivalent),
frontend/src/pages/MonCompte.tsx et frontend/src/App.tsx avant de commencer.

## CONTEXTE

OfferTrail est développé par CraftCodes, auto-entreprise de développement indépendante.
Le prix Pro est 14,99€/mois.
On affiche la décomposition honnête du prix — pas les revenus totaux.

Décomposition à afficher :
  Stripe (paiement)  : ~0,47€
  URSSAF (charges)   : ~4,79€
  Ce qui reste       : ~9,73€

---

## COMMIT 1 — Mettre à jour le prix partout

Cherche toutes les occurrences de "9,99" et "9.99" dans le projet :

```bash
grep -r "9,99\|9\.99" frontend/src/ landing/ src/
```

Remplacer par "14,99" / "14.99" partout sauf dans les tests (les laisser).

Dans `src/services/subscription.py` :
```python
PLANS = {
    "pro": {
        "prix_mensuel": 14.99,
        ...
    }
}
```

```bash
git add .
git commit -m "chore: update pro plan price to 14.99€/month"
```

---

## COMMIT 2 — Page Pricing avec transparence CraftCodes

Lis la page Pricing existante (frontend/src/pages/Pricing.tsx ou équivalent).
Remplacer la section pricing par cette version enrichie.
Garder le style CSS existant du projet — ne pas importer de librairie externe.

La page doit contenir dans cet ordre :

### Section 1 — Card Pro unique (existante, adapter le prix)
```
PRO
14,99€/mois

✓ Candidatures illimitées
✓ Analytics complets
✓ Score de probité
✓ File de relances
✓ Export CSV

[Passer en Pro] ou [Plan actif]
```

### Section 2 — Bloc transparence prix (NOUVEAU)

```tsx
<div style={{
  marginTop: '2rem',
  padding: '1.25rem',
  borderRadius: '12px',
  border: '0.5px solid var(--color-border-tertiary)',
  background: 'var(--color-background-secondary)',
}}>
  <p style={{
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    color: 'var(--color-text-tertiary)',
    margin: '0 0 12px',
  }}>
    Où va ton argent ?
  </p>

  {/* Ligne Stripe */}
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: '13px' }}>
    <span style={{ color: 'var(--color-text-secondary)' }}>Stripe — traitement du paiement</span>
    <span style={{ color: 'var(--color-text-secondary)' }}>~0,47€</span>
  </div>

  {/* Ligne URSSAF */}
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: '13px' }}>
    <span style={{ color: 'var(--color-text-secondary)' }}>URSSAF — charges sociales (33%)</span>
    <span style={{ color: 'var(--color-text-secondary)' }}>~4,79€</span>
  </div>

  {/* Ligne reste */}
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
    <span style={{ fontWeight: 500 }}>Rémunération du développeur</span>
    <span style={{ fontWeight: 500, color: 'var(--color-text-success)' }}>~9,73€</span>
  </div>

  {/* Texte CraftCodes */}
  <p style={{
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
    marginTop: '12px',
    lineHeight: '1.6',
  }}>
    OfferTrail est développé et maintenu par{' '}
    <a
      href="https://craftcodes.fr"
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--color-text-info)', textDecoration: 'none' }}
    >
      CraftCodes
    </a>
    , une auto-entreprise indépendante. Pas d'équipe marketing,
    pas d'investisseurs. Juste un développeur qui a construit
    l'outil dont il avait besoin.
  </p>
</div>
```

```bash
git add frontend/src/pages/Pricing.tsx
git commit -m "feat: add price transparency block with craftcodes on pricing page"
```

---

## COMMIT 3 — Footer avec mentions légales CraftCodes

Lis frontend/src/App.tsx.
Trouver le composant footer (className="app-footer" ou équivalent).
Remplacer le contenu du footer par :

```tsx
<footer className="app-footer">
  <div className="app-footerInner" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  }}>
    <span>OfferTrail © {new Date().getFullYear()} — Un produit{' '}
      <a
        href="https://craftcodes.fr"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}
      >
        CraftCodes
      </a>
    </span>
    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
      <a href="/app/legal/cgu" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>CGU</a>
      <a href="/app/legal/confidentialite" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Confidentialité</a>
      <a href="mailto:contact@craftcodes.fr" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Contact</a>
    </div>
  </div>
</footer>
```

Ce footer s'affiche dans AppLayout (routes /app/*) ET sur les pages publiques.
S'il y a deux footers (un dans AppLayout, un hors), les mettre à jour tous les deux.

```bash
git add frontend/src/App.tsx
git commit -m "feat: footer with craftcodes branding and legal links"
```

---

## COMMIT 4 — Pages légales minimales

Créer `frontend/src/pages/legal/CGU.tsx` :

```tsx
export const CGU: React.FC = () => {
  useEffect(() => { document.title = 'CGU — OfferTrail' }, [])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2rem' }}>
        Conditions Générales d'Utilisation
      </h1>

      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '13px' }}>
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Éditeur</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          OfferTrail est édité par CraftCodes, auto-entrepreneur immatriculé en France.
          Contact : <a href="mailto:contact@craftcodes.fr" style={{ color: 'var(--color-text-info)' }}>contact@craftcodes.fr</a>
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Service</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          OfferTrail est un outil de suivi de candidatures accessible en ligne.
          Un plan Starter gratuit (limité à 25 candidatures) et un plan Pro à 14,99€/mois
          sont proposés. Le paiement est traité par Stripe.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Abonnement et résiliation</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          L'abonnement Pro est mensuel et sans engagement. Il peut être résilié
          à tout moment depuis la page Mon Compte. La résiliation prend effet
          à la fin de la période en cours. Aucun remboursement prorata n'est effectué
          sur la période déjà facturée.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Données</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Les données saisies (candidatures, contacts, établissements) sont stockées
          sur des serveurs sécurisés (Supabase, Union Européenne).
          Elles ne sont ni vendues ni partagées à des tiers.
          Chaque utilisateur peut exporter ou supprimer ses données à tout moment.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Limitation de responsabilité</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          OfferTrail est fourni "tel quel". CraftCodes ne garantit pas un résultat
          dans la recherche d'emploi et ne saurait être tenu responsable des décisions
          prises sur la base des informations affichées.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Droit applicable</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Les présentes CGU sont soumises au droit français.
          Tout litige relève de la compétence des tribunaux français.
        </p>
      </section>
    </div>
  )
}
```

Créer `frontend/src/pages/legal/Confidentialite.tsx` :

```tsx
export const Confidentialite: React.FC = () => {
  useEffect(() => { document.title = 'Confidentialité — OfferTrail' }, [])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2rem' }}>
        Politique de confidentialité
      </h1>

      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '13px' }}>
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Responsable du traitement</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          CraftCodes — auto-entrepreneur<br />
          contact@craftcodes.fr
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Données collectées</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Email (pour l'authentification), données de candidatures saisies
          volontairement (entreprises, postes, statuts, contacts, notes).
          Aucune donnée n'est collectée sans action explicite de l'utilisateur.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Utilisation</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Les données sont utilisées uniquement pour fournir le service OfferTrail.
          Elles ne sont jamais vendues, revendues ou partagées à des tiers
          à des fins commerciales ou publicitaires.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Hébergement</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Les données sont hébergées par Supabase (Union Européenne)
          et Railway. Le paiement est traité par Stripe. Ces sous-traitants
          sont conformes au RGPD.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Score de probité</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Les données de candidatures contribuent de manière anonymisée au calcul
          du score de probité des établissements. Aucune donnée personnelle
          (email, nom) n'est exposée dans ce calcul. Un minimum de 3 candidatures
          est requis pour qu'un score soit affiché.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Vos droits</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
          de suppression et de portabilité de vos données.
          Pour exercer ces droits : <a href="mailto:contact@craftcodes.fr" style={{ color: 'var(--color-text-info)' }}>contact@craftcodes.fr</a>
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Cookies</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          OfferTrail n'utilise pas de cookies publicitaires ni de trackers tiers.
          Un cookie de session est utilisé pour maintenir la connexion.
          Aucun outil d'analytics tiers n'est actif à ce jour.
        </p>
      </section>
    </div>
  )
}
```

Ajouter les routes dans `App.tsx` — routes publiques (pas besoin d'être connecté) :

```tsx
import { CGU } from './pages/legal/CGU'
import { Confidentialite } from './pages/legal/Confidentialite'

// Dans les routes /app/* (AppLayout)
<Route path="legal/cgu"             element={<CGU />} />
<Route path="legal/confidentialite" element={<Confidentialite />} />
```

```bash
git add frontend/src/pages/legal/ frontend/src/App.tsx
git commit -m "feat: legal pages - CGU and privacy policy with craftcodes"
```

---

## COMMIT 5 — Landing page : section CraftCodes

Lis `landing/index.html`.
Ajouter une section entre les features et le CTA final :

```html
<!-- Section CraftCodes — après #features, avant le CTA final -->
<section style="max-width:680px;margin:0 auto;padding:60px 24px;text-align:center;">
  <p style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
            color:rgba(255,255,255,0.3);margin:0 0 16px;">
    Qui est derrière OfferTrail ?
  </p>
  <h2 style="font-size:28px;font-weight:800;margin:0 0 16px;">
    Un développeur. Pas une boîte.
  </h2>
  <p style="font-size:16px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 32px;">
    OfferTrail est développé et maintenu par
    <a href="https://craftcodes.fr" target="_blank" rel="noopener noreferrer"
       style="color:#38bdf8;text-decoration:none;">CraftCodes</a>,
    une auto-entreprise indépendante. J'ai construit cet outil en cherchant
    du boulot moi-même — 43 candidatures, 69% de refus, un tableau Excel
    qui devenait ingérable.
  </p>

  <!-- Décomposition prix -->
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
              border-radius:16px;padding:24px;text-align:left;max-width:400px;margin:0 auto;">
    <p style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
              color:rgba(255,255,255,0.3);margin:0 0 16px;">
      Sur 14,99€/mois
    </p>
    <div style="display:flex;justify-content:space-between;padding:8px 0;
                border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;">
      <span style="color:rgba(255,255,255,0.5);">Stripe (paiement)</span>
      <span style="color:rgba(255,255,255,0.5);">~0,47€</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;
                border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;">
      <span style="color:rgba(255,255,255,0.5);">URSSAF (charges 33%)</span>
      <span style="color:rgba(255,255,255,0.5);">~4,79€</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:14px;font-weight:600;">
      <span>Rémunération du développeur</span>
      <span style="color:#38bdf8;">~9,73€</span>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:12px 0 0;line-height:1.6;">
      Pas d'investisseurs. Pas de padding. Le prix reflète un travail réel.
    </p>
  </div>
</section>
```

Mettre à jour le footer de la landing :

```html
<footer ...>
  <p>
    © 2026 OfferTrail —
    <a href="https://craftcodes.fr" target="_blank" rel="noopener noreferrer"
       style="color:var(--accent);text-decoration:none;">CraftCodes</a>
    ·
    <a href="https://app.offertrail.fr/app/legal/cgu"
       style="color:rgba(255,255,255,0.4);text-decoration:none;">CGU</a>
    ·
    <a href="https://app.offertrail.fr/app/legal/confidentialite"
       style="color:rgba(255,255,255,0.4);text-decoration:none;">Confidentialité</a>
  </p>
</footer>
```

```bash
git add landing/
git commit -m "feat: landing - craftcodes section with price breakdown"
```

---

## VÉRIFICATION

```bash
# Vérifier qu'il ne reste plus de "9,99" nulle part
grep -r "9,99\|9\.99" frontend/src/ landing/ src/

# Build
cd frontend && npm run build && cd ..

# Tests
pytest tests/ -v
```

**PR title :** `feat: craftcodes branding + price transparency + legal pages`
**Target :** `dev`
**Branche :** `feat/craftcodes-transparency`
