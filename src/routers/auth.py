import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from src.database import get_db
from src.models import PasswordResetToken, User
from src.schemas.auth import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserSchema,
    UserUpdate,
)
from src.services.email import send_password_reset

router = APIRouter()


def _build_auth_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, user.email),
        token_type="bearer",
        user=UserSchema.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email deja utilise")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        prenom=payload.prenom,
        nom=payload.nom,
        plan="starter",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_auth_response(user)


@router.post("/login", response_model=TokenResponse)
def login(
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserSchema:
    if payload.prenom is not None:
        current_user.prenom = payload.prenom
    if payload.nom is not None:
        current_user.nom = payload.nom
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserSchema.model_validate(current_user)


@router.post("/forgot-password")
def forgot_password(
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
