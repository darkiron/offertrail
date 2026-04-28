# PR Manual — feat/landing-rich → dev

**PR:** darkiron/offertrail#52  
**Branche:** `feat/landing-rich`  
**Cible:** `dev`  
**Date:** 2026-04-08  

---

## Stone step validée

> Landing page riche + pages légales + routing `/app/*`

---

## Checklist de validation avant merge

### Visuel

- [ ] Landing `/` : hero lisible, sections features/pricing/CTA présentes
- [ ] Footer avec liens vers CGV, Mentions légales, RGPD, Contact
- [ ] `/cgv` — page CGV complète
- [ ] `/legal` — mentions légales complètes
- [ ] `/confidentialite` — politique de confidentialité RGPD
- [ ] `/contact` — formulaire de contact fonctionnel
- [ ] Thème Catppuccin appliqué dès le chargement (pas de flash blanc)

### Routing & Auth

- [ ] `/app/` sans auth → redirect login
- [ ] `/app/candidatures`, `/app/contacts`, etc. → protégés
- [ ] Login redirect vers `/app/` après auth
- [ ] `/login`, `/register` accessibles sans auth

### Build & qualité

- [ ] `npm run build` → 0 erreur TypeScript
- [ ] Pas de régression sur les pages existantes (dashboard, candidatures…)

---

## Commande de merge si tout est OK

```bash
gh pr merge 52 --merge --delete-branch
```

Ou via l'interface GitHub : **Merge pull request** (no squash, no rebase — merge commit).

---

## Rollback si problème

```bash
git revert HEAD --no-edit
git push origin dev
```
