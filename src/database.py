import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from src.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./offertrail.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine_kwargs = {"connect_args": connect_args}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(
    DATABASE_URL,
    **engine_kwargs,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()


def _ensure_sqlite_columns() -> None:
    if not DATABASE_URL.startswith("sqlite"):
        return

    required_columns = {
        "users": {
            "role": "ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'",
            "plan_started_at": "ALTER TABLE users ADD COLUMN plan_started_at DATETIME",
            "plan_expires_at": "ALTER TABLE users ADD COLUMN plan_expires_at DATETIME",
            "stripe_customer_id": "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR",
        },
        "candidatures": {
            "client_final_id": "ALTER TABLE candidatures ADD COLUMN client_final_id VARCHAR",
        },
    }

    with engine.begin() as connection:
        for table_name, columns in required_columns.items():
            existing = {
                row[1]
                for row in connection.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            }
            for column_name, statement in columns.items():
                if column_name not in existing:
                    connection.execute(text(statement))
