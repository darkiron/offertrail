# OfferTrail frontend

Application React 19 et TypeScript stricte construite avec Vite 8. La définition produit et les règles transverses restent dans le [README racine](../README.md) et [docs/product-definition.md](../docs/product-definition.md).

## Prérequis et lancement

- Node.js 24, conformément à `.nvmrc` et `package.json` ;
- npm avec installation reproductible par lockfile.

```bash
cp .env.example .env.dev
npm ci
npm run dev
```

Variables requises pour les parcours authentifiés : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et la cible API. Voir [la matrice des environnements](../docs/engineering/environments.md).

## Organisation actuelle

- `src/App.tsx` : providers et registre de routes actuel ;
- `src/pages` : orchestrateurs de routes ;
- `src/templates` : layouts publics et applicatifs actuels ;
- `src/components` : primitives et compositions partagées ;
- `src/features` : slices métier en cours d'adoption ;
- `src/services/api` : client et contrats API actuellement manuels ;
- `src/i18n` : traductions typées ;
- `src/styles` : tokens, fondations et entrée SCSS globale.

L'architecture cible et les règles de dépendance sont dans [docs/architecture/frontend.md](../docs/architecture/frontend.md). Ne pas créer une seconde implémentation parallèle pour anticiper la cible.

## Qualité

```bash
npm run check
npm test
npm run build
npm run test:coverage
npm run test:e2e
```

`check` vérifie formatage, ESLint, Stylelint, TypeScript et code mort. Le build applique les budgets de bundles. Vitest/Testing Library mesure actuellement les fondations testées et Playwright exécute les smoke tests publics desktop/mobile ; cela ne constitue pas encore une couverture globale des parcours métier. La portée exacte et la trajectoire sont dans [la stratégie de tests](../docs/engineering/testing-strategy.md).

## Sécurité navigateur et API

En développement, laisser `VITE_API_URL` vide : Axios utilise l'origine courante et Vite proxifie les chemins API vers `VITE_API_PROXY_TARGET`. En production, `VITE_API_URL` désigne actuellement `https://api.offertrail.fr`, explicitement autorisé par la CSP avec Supabase. Voir [la stratégie navigateur et transport](../docs/engineering/frontend-security.md).
