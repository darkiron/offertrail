import os
from pathlib import Path

TEST_DB_PATH = Path("test_runtime_offertrail.db")

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"

if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

import src.legacy_database as legacy_database

legacy_database.DB_PATH = TEST_DB_PATH
