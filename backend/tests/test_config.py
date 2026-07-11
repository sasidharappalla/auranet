import pytest
from pydantic import ValidationError

from app.config import Settings


@pytest.mark.parametrize(
    "variable",
    [
        "DATABASE_URL",
        "MINIO_ACCESS_KEY",
        "MINIO_SECRET_KEY",
        "RABBITMQ_URL",
        "JWT_SECRET",
    ],
)
def test_sensitive_settings_are_required(
    monkeypatch: pytest.MonkeyPatch,
    variable: str,
) -> None:
    monkeypatch.delenv(variable)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
