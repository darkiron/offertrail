import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from src.auth import (
    create_access_token,
    get_current_user,
    get_current_user_id,
    hash_password,
    verify_password,
)
from src.database import get_db
from src.models import PasswordResetToken, User
from src.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserSchema,
    UserUpdate,
)
from src.services.email import send_password_reset

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _build_auth_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, user.email),
        token_type="bearer",
        user=UserSchema.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email deja utilise")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        prenom=payload.prenom,
        nom=payload.nom,
        plan="starter",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = db.query(User).filter(User.email == form_data.username).first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    return _build_auth_response(user)


@router.get("/me", response_model=UserSchema)
def me(current_user: User = Depends(get_current_user)) -> UserSchema:
    return UserSchema.model_validate(current_user)


@router.patch("/me", response_model=UserSchema)
def update_me(
    payload: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> UserSchema:
    current_user = (
        db.query(User.id, User.email, User.plan, User.created_at, User.is_active)
        .filter(User.id == user_id)
        .first()
    )
    if current_user is None or not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")

    updates: dict[str, str] = {}
    if payload.prenom is not None:
        updates["prenom"] = payload.prenom
    if payload.nom is not None:
        updates["nom"] = payload.nom
    if updates:
        db.query(User).filter(User.id == user_id).update(updates)
        db.commit()
    current_user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    return UserSchema.model_validate(current_user)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    current_user = (
        db.query(User.hashed_password, User.is_active)
        .filter(User.id == user_id)
        .first()
    )
    if current_user is None or not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")

    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel invalide")

    db.query(User).filter(User.id == user_id).update({"hashed_password": hash_password(payload.new_password)})
    db.commit()
    return {"message": "Mot de passe mis a jour avec succes."}


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user = db.query(User).filter(User.email == body.email).first()

    if user:
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used.is_(False),
        ).update({"used": True})

        token = secrets.token_urlsafe(32)
        reset = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db.add(reset)
        db.commit()

        reset_url = f"http://localhost:5173/reset-password?token={token}"
        send_password_reset(user.email, reset_url)

    return {"message": "Si cet email est enregistré, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password(
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    reset = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == body.token,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not reset:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")

    reset.user.hashed_password = hash_password(body.new_password)
    reset.used = True
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès."}
