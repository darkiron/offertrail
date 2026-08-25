# Incident Supabase — RLS désactivée

Date de contrôle : 18 août 2026

## Diagnostic confirmé

La table `public.stripe_webhook_events` est la seule table applicative du schéma `public` avec la RLS désactivée.

- l’API anonyme Supabase répondait `200` sur cette table ;
- les rôles `anon` et `authenticated` possédaient tous les privilèges ;
- la table ne contenait aucune ligne au moment du contrôle ;
- aucune migration ni aucun code applicatif ne référençait cette table.

## Correctif versionné

La migration `514986c318b7_secure_stripe_webhook_events_rls.py` :

1. vérifie que PostgreSQL et la table sont présents ;
2. active la Row-Level Security ;
3. révoque tous les privilèges de `PUBLIC`, `anon` et `authenticated` ;
4. ne crée aucune policy Data API ;
5. ne rouvre pas la faille lors d’un downgrade.

Le backend conserve son accès direct PostgreSQL. La migration ne modifie ni les données ni les privilèges du rôle `service_role`.

## Validation avant déploiement

Le SQL a été exécuté dans une transaction sur la base configurée puis annulé :

- `rls_enabled = true` ;
- `anon_select = false` ;
- `authenticated_select = false`.

## Vérification après déploiement

Après `alembic upgrade head` :

```sql
select
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', 'public.stripe_webhook_events', 'SELECT') as anon_select,
  has_table_privilege('authenticated', 'public.stripe_webhook_events', 'SELECT') as authenticated_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'stripe_webhook_events';
```

Attendu : `true`, `false`, `false`. Relancer ensuite le Security Advisor Supabase.
