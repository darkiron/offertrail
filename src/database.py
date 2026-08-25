from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from src.config import settings
from src.models import Base

DATABASE_URL = settings.DATABASE_URL

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
    if DATABASE_URL.startswith("sqlite"):
        inspector = inspect(engine)
        columns = {column["name"] for column in inspector.get_columns("profiles")}
        with engine.begin() as connection:
            if "plan" not in columns:
                connection.execute(text("ALTER TABLE profiles ADD COLUMN plan VARCHAR DEFAULT 'free'"))
            if "billing_period" not in columns:
                connection.execute(text("ALTER TABLE profiles ADD COLUMN billing_period VARCHAR"))
