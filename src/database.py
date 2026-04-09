import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./offertrail.db")

# check_same_thread est SQLite uniquement
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Utilisé uniquement pour les tests (BDD en mémoire). Ne pas appeler en production."""
    Base.metadata.create_all(bind=engine)
