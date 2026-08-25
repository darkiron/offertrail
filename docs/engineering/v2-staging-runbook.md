# V2 staging environment — runbook

> Companion to `docs/adr/0002-backend-architecture.md` and the V2 rewrite tracked as GitHub issues #149-#163. This document exists because provisioning the staging environment (#163) requires real cloud account actions that an agent should not take unilaterally — it's a runbook for the project owner, not something that self-executes.

## Why this exists

The V2 plan's validation strategy needs an isolated environment (separate Supabase database, Stripe test-mode keys, a staging deploy target) to test the rewritten backend and frontend against realistic data before either touches production. This document captures exactly what's needed and what's already been checked.

## Supabase

**Status as of this writing: branching is not available.** The live `offertrail` Supabase project (`plctgoibhbbmozzagfcm`, org `ljmffilgdnwzztbotbaq`) returned `PaymentRequiredException: Branching is supported only on the Pro plan or above` when branch creation was attempted. Two options, your call:

1. **Upgrade to Supabase Pro**, then create a branch (`$0.01344/hour` while the branch exists, ~$9.68/mo if left running continuously — delete it once staging validation wraps up). A branch seeded from production gives the closest match to real data/schema.
2. **Create a separate, standalone free-tier project** (`$0/mo`) in the same org. This does **not** copy production data — you'd apply the Alembic migration history to get an empty schema, then seed it with synthetic test data. Arguably better practice for a staging environment anyway (no real customer PII in a lower-trust environment), but requires manually keeping schema in sync via Alembic rather than getting it for free via branch-merge.

Once you've decided and the project/branch exists, apply migrations the same way the production deploy does:

```bash
DATABASE_URL=<staging-connection-string> alembic upgrade head
```

## Stripe test mode

1. Stripe Dashboard → toggle to **Test mode**.
2. Create test-mode equivalents of the 4 live prices referenced in `src/config.py` (`STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_ULTIMATE_MONTHLY`, `STRIPE_PRICE_ULTIMATE_YEARLY`).
3. Developers → Webhooks → Add endpoint, pointed at the staging backend's `/subscription/webhook` (see Render staging service below for the URL once it exists). Subscribe to the same events as production (`docs/render-deployment.md` lists them): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Also add `customer.subscription.created` and `customer.subscription.trial_will_end` — both are handled by `SubscriptionService` (`src/services/subscription.py`) but aren't in the production doc's list; worth reconciling that gap while you're in there regardless of staging.
4. Copy the test-mode `sk_test_...`, `pk_test_...`, and the webhook's `whsec_...` — these become the staging service's `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/`STRIPE_WEBHOOK_SECRET`.
5. Use `stripe trigger` / `stripe listen --forward-to <staging-url>/subscription/webhook` to replay realistic event sequences during validation.

## Render staging service

Follow `docs/render-deployment.md`'s steps for a second Web Service (e.g. `offertrail-api-v2-staging`), pointed at the `refactor/backend-v2` branch instead of `main`, with:
- `DATABASE_URL` → the staging Supabase project/branch's connection string.
- `SUPABASE_URL` / `SUPABASE_JWT_SECRET` → same values as production is fine (staging backend still needs to verify real Supabase Auth JWTs) **unless** you also want a separate Supabase Auth instance for staging — not required for V2 validation, since auth verification logic isn't what's being tested here.
- Stripe variables → the test-mode values from above.
- `ALLOWED_ORIGINS` → whatever staging frontend URL you deploy (Vercel preview URL, or a `app-staging.offertrail.fr` subdomain if you want a stable one).

## Frontend staging deploy

Point a Vercel preview/staging deployment of `refactor/frontend-atomic-scss` at the Render staging backend's URL via its API base URL env var.

## What's already done, for context

- `refactor/backend-v2`: full structural rewrite merged, 201 backend tests passing.
- `refactor/frontend-atomic-scss`: full architecture migration merged, 27+8 frontend tests passing, bundle budget green.
- Neither branch has been merged into `dev` yet — that's a separate decision from standing up staging.

## Next steps once staging exists

Follow the validation track in the V2 plan: full pytest + manual smoke on the backend, full Playwright e2e (including a real test-mode checkout → webhook → plan-upgrade round trip) on the frontend, an OpenAPI schema diff between production and staging, and a security review pass on the auth/billing surfaces — all before either branch is considered for a production cutover.
