# Frontend refactor — working agreement historique

> **Statut : cible initiale et baseline historique.** Les métriques ne décrivent plus le dépôt courant. La séparation AS-IS/TO-BE et la règle de migration applicables sont dans `docs/architecture/frontend.md`; les règles Git communes sont dans `CONTRIBUTING.md`.

## Git flow

- Integration branch: `refactor/frontend-atomic-scss`, created from `dev`.
- No direct commit or merge to `dev` or `main`.
- Each story is implemented on a dedicated branch created from the integration branch.
- A story is synchronized with the integration branch before review.
- Only reviewed stories are merged into the integration branch; the integration branch is then proposed to `dev` through a PR.

## Target architecture

```text
src/
├── app/                 # providers, router and route configuration
├── features/            # application, organization, contact, billing…
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── layouts/             # public, auth and authenticated route layouts
├── pages/               # thin route orchestrators
├── services/            # API clients split by domain
├── i18n/
│   ├── locales/fr/
│   └── locales/en/
└── styles/
    ├── abstracts/       # tokens, breakpoints and mixins
    ├── base/            # reset, typography and accessibility
    └── main.scss        # single global entry point
```

Component styles are colocated `*.module.scss`. Pages only own composition styles that cannot live in a reusable component. User-facing text, accessibility labels, notifications and errors live in typed locale files; versioned legal documents live in structured locale content.

## Product backlog

1. **Guardrails** — reliable lint, typecheck, format, tests and CI budgets.
2. **SCSS foundations** — Sass, one token source, mixins, reset and one global entry point.
3. **Typed i18n foundations** — lightweight provider, namespaced locale files and key-parity checks.
4. **Atomic taxonomy** — consolidate duplicate badges, buttons and headers; relocate shells and legal layout.
5. **Semantic layouts and routing** — Public/Auth/App layouts, one `<main>`, canonical redirects and shared navigation config.
6. **Legal integrity** — fix the broken CGV link, choose canonical documents and render structured legal content once.
7. **Vertical migrations** — Auth, Applications, Organizations, Contacts, Dashboard, Account and Admin.
8. **Dead-code purge** — remove only after import-graph and runtime verification.
9. **Performance** — split the API/admin/chart bundles and enforce an agreed chunk budget.

Dependencies: `1 → (2 + 3)`, `2 → 4`, `(3 + 4) → (5 + 6)`, `(5 + 6) → 7 → 8 → 9`.

## Definition of Done

- The story has one responsibility and does not introduce a parallel legacy implementation.
- Page components orchestrate only; API and feature logic are outside pages.
- No visible, accessibility, validation or notification text is hard-coded in TSX.
- French and English keys are strictly identical and automatically checked.
- Styles use colocated SCSS modules and semantic tokens; no new literal color or `!important`.
- Responsive behavior, keyboard navigation, focus visibility and reduced motion are verified.
- Replaced code and styles are removed after references are proven absent.
- ESLint has zero errors and warnings; typecheck, build and relevant tests pass.
- The affected bundle and CSS size do not grow without documented justification.
- The branch is synchronized with the integration branch and reviewed before merge.

## Baseline (2026-08-24)

- 97 TypeScript/TSX files and 7,438 lines.
- 56 CSS files and 2,916 lines; no SCSS.
- 351 likely hard-coded JSX text occurrences.
- 23 ESLint errors and 3 warnings.
- `i18n.tsx`: 1,382 lines; `services/api.ts`: 980 lines; `Admin.tsx`: 444 lines.
- Main bundle: 575.11 kB minified; Admin bundle: 421.67 kB minified.
- 729 literal color occurrences and 20 `!important` declarations.
