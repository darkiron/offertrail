from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.auth import get_current_user
from src.database import get_db
from src.models import User
from src.services.subscription import (
    activate_pro,
    get_usage,
)

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/me")
def my_subscription(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_usage(db, user)


@router.post("/upgrade")
def upgrade(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    activate_pro(db, user)
    db.refresh(user)
    return get_usage(db, user)
