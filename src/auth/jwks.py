"""
OfferTrail — Vérification JWT Supabase (JWKS + fallback HS256)

Supabase émet des JWTs signés en ES256 (clé EC asymétrique).
La clé publique est récupérée depuis le endpoint JWKS de Supabase au démarrage.
"""
import logging
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from src.config import settings

logger = logging.getLogger(__name__)

SUPABASE_URL = settings.SUPABASE_URL


def _load_supabase_jwks() -> list[dict]:
    """
    Récupère les clés publiques depuis le endpoint JWKS de Supabase (public, sans auth).
    Retourne la liste de JWK, ou [] si indisponible.
    """
    if not SUPABASE_URL:
        return []
    try:
        r = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=10)
        r.raise_for_status()
        keys = r.json().get("keys", [])
        if keys:
            algos = [k.get("alg") for k in keys]
            logger.info("Clés publiques Supabase (JWKS) chargées — algos=%s", algos)
        return keys
    except Exception as exc:
        logger.warning("Impossible de charger le JWKS Supabase : %s", exc)
        return []


# Clés publiques Supabase chargées une fois au démarrage.
# Fallback : vérification HS256 si SUPABASE_JWT_SECRET est défini (projets legacy).
_SUPABASE_JWKS: list[dict] = _load_supabase_jwks()
_SUPABASE_HS256_SECRET: str = settings.SUPABASE_JWT_SECRET

bearer_scheme = HTTPBearer(auto_error=False)


def get_jwt_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Décode et retourne le payload complet du JWT Supabase.
    Supporte ES256 (JWKS, projets Supabase récents) et HS256 (legacy).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifié",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    decode_opts = {"verify_aud": False}

    # Priorité 1 : JWKS (ES256 / RS256 — projets Supabase récents, clé asymétrique)
    for jwk in _SUPABASE_JWKS:
        alg = jwk.get("alg", "ES256")
        try:
            return jwt.decode(token, jwk, algorithms=[alg], options=decode_opts)
        except JWTError:
            continue

    # Priorité 2 : HS256 via le secret partagé (projets Supabase legacy)
    if _SUPABASE_HS256_SECRET:
        try:
            return jwt.decode(token, _SUPABASE_HS256_SECRET, algorithms=["HS256"], options=decode_opts)
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
