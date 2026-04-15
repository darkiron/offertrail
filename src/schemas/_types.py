"""Shared Pydantic field types for UUID → str coercion.

PostgreSQL UUID columns are returned as uuid.UUID objects by psycopg2,
but our schemas use str. These annotated types handle the coercion transparently.
"""
from typing import Annotated

from pydantic import BeforeValidator


def _uuid_to_str(v: object) -> str | None:
    if v is None:
        return None
    return str(v)


UuidStr = Annotated[str, BeforeValidator(str)]
OptUuidStr = Annotated[str | None, BeforeValidator(_uuid_to_str)]
