# OfferTrail frontend

Frontend React 19, TypeScript and Vite for OfferTrail.

## Prerequisites

- Node.js 24
- npm (use `npm ci` to reproduce the lockfile exactly)

## Development

```sh
npm ci
npm run dev
```

## Quality checks

Run the complete local quality gate before opening a pull request:

```sh
npm run check
```

The aggregate command runs these checks in order:

- `npm run format:check`: verify formatting without changing files;
- `npm run lint`: run ESLint and reject both errors and warnings;
- `npm run stylelint`: lint existing CSS and future SCSS modules;
- `npm run typecheck`: type-check all TypeScript projects without emitting files;
- `npm run deadcode`: detect unused files, exports and dependencies with Knip.

Use `npm run format` and `npm run stylelint:fix` for explicit, local fixes. These
commands modify files and are intentionally not part of `npm run check`.

Build the production bundle with:

```sh
npm run build
```

The build runs the same TypeScript check before invoking Vite.

The guardrails report the current debt as failures. Do not weaken a rule, add an
ignore pattern or raise a warning threshold to make a check green. Fix the issue
in its dedicated feature branch instead.
