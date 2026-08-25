"""
OfferTrail — Auth via Supabase JWT.

FastAPI vérifie le token émis par Supabase Auth. Plus de gestion de
passwords ni de register côté backend.

Ce package est un éclatement du module plat historique `src/auth.py` :

- `src.auth.jwks` : récupération/cache des clés JWKS Supabase et
  vérification brute du JWT (ES256/RS256 via JWKS, fallback HS256).
- `src.auth.dependencies` : dépendances FastAPI (`get_current_profile`, ...)
  et les équivalents RLS Supabase (visibilité des contacts, ownership).
- `src.auth.probite_scheduler` : job périodique de recalcul du score de probité.

La logique de vérification elle-même n'est pas modifiée par cet éclatement
— seulement réorganisée. Tous les noms précédemment importables depuis
`src.auth` (le module plat) restent importables depuis `src.auth` (le
package) via les ré-exports ci-dessous.
"""
from src.auth.jwks import (
    SUPABASE_URL,
    _load_supabase_jwks,
    bearer_scheme,
    get_jwt_payload,
    logger,
)
from src.auth.dependencies import (
    _extract_profile_names,
    _user_can_see_contact,
    contact_visible_by_user,
    get_active_profile,
    get_active_user_id,
    get_admin_profile,
    get_current_profile,
    get_current_user_id,
    get_visible_contacts,
    own_candidature,
)
from src.auth.probite_scheduler import (
    _run_probite_recompute,
    scheduler,
    start_scheduler,
)

__all__ = [
    "SUPABASE_URL",
    "_load_supabase_jwks",
    "bearer_scheme",
    "get_jwt_payload",
    "_extract_profile_names",
    "_user_can_see_contact",
    "contact_visible_by_user",
    "get_active_profile",
    "get_active_user_id",
    "get_admin_profile",
    "get_current_profile",
    "get_current_user_id",
    "get_visible_contacts",
    "own_candidature",
    "_run_probite_recompute",
    "scheduler",
    "start_scheduler",
]
