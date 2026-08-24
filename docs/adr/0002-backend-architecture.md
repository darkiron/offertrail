# ADR-0002: Backend dependency architecture

- Status: accepted
- Date: 2026-08-24

## Context

`src/main.py` has grown into 1,100+ lines that mix FastAPI bootstrap, CORS and
middleware setup with route handlers, legacy-format mappers and inline
SQLAlchemy queries. Several routers under `src/routers/` already delegate
business rules to `src/services/` (`subscription.py`, `stripe_service.py`),
but query the database directly with `db.query(...)` inline rather than
through a dedicated data-access layer, and `src/main.py` still defines its own
`api_*` handlers alongside them with the same inline-query pattern. Business
rules — plan limits, Stripe checkout and webhook handling, probité scoring —
are partly centralized in `src/services/` and partly still inline in routers
and `main.py`. Environment variables are read ad hoc via `os.getenv()` at
whatever module happens to need them (`main.py`, `auth.py`,
`stripe_service.py`, ...), with no single source of truth for configuration
or its defaults.

This is a live production SaaS with real Stripe live-mode billing and real
user data, so the rewrite must proceed incrementally, slice by slice, rather
than as a rewrite-and-cutover. This ADR sets the target dependency direction
the V2 backend work (issues #150-#156) will migrate towards.

## Decision

New and migrated code follows this dependency direction:

`routers -> services -> repositories -> models`

A lower layer must never import a higher layer.

`routers/` is the thin HTTP layer: request/response shaping, status codes and
delegation to `services/`. A router does not construct SQLAlchemy queries and
does not encode business rules — it calls a service function and translates
the result (or raised error) into an HTTP response.

`services/` holds business logic: subscription and billing rules, Stripe
webhook handling, email, probité scoring. Services depend on `repositories/`
for data access and never import from `routers/`.

`repositories/` holds per-domain SQLAlchemy query functions, extracted out of
routers and out of `main.py`. A repository module depends only on
`models.py` — no business rules, no HTTP concerns.

`models.py` remains the single source of truth for schema as SQLAlchemy ORM
models. It is evolved through Alembic migrations against the existing
database; it is never regenerated or recreated from scratch.

`config.py` introduces a single Pydantic `Settings` object as the one place
environment variables are read, replacing the scattered `os.getenv()` calls
across `main.py`, `auth.py`, `stripe_service.py` and elsewhere.

## Migration rule

Mirroring ADR-0001: each story or PR migrates one bounded context fully — for
example, one domain's repository layer, or the Stripe service boundary — and
deletes the legacy code it makes unreachable in the same change. No parallel
legacy path is introduced without this ADR governing its removal date, and no
compatibility barrel module is added to bridge old and new call sites.

## Consequences

The repository temporarily contains both the target layering and legacy code
that has not yet been migrated (starting with the bulk of `src/main.py`).
This is an explicit migration state, not permission to add new code in the
legacy inline-query style.

The Stripe webhook contract — the event types handled
(`checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`customer.subscription.trial_will_end`) and the exact `Profile` fields each
one writes — is an externally-integrated, live contract and must be preserved
exactly as behavior moves from `routers/subscription.py` into a service. The
same applies to the Supabase JWT verification logic in `auth.py` (JWKS-based
ES256/RS256 verification with HS256 fallback, and the `sub` claim as the
canonical user id). This ADR governs internal code organization; it does not
authorize changes to either external contract, which can only change via
their own dedicated review.
