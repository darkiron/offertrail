from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.auth import get_active_profile, get_active_user_id
from src.database import get_db
from src.models import Profile
from src.services.import_csv import process_tsv_import
from src.services.subscription import require_plan_feature

router = APIRouter()


@router.post("/api/import")
def api_process_import(
    data: dict,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
    profile: Profile = Depends(get_active_profile),
):
    require_plan_feature(profile, "import_csv")
    return process_tsv_import(db, data.get("tsv", ""), user_id)
