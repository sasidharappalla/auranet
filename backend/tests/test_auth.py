from jose import jwt

from app.auth import create_access_token, hash_password, verify_password
from app.config import settings


def test_password_hash_round_trip() -> None:
    hashed = hash_password("correct horse battery staple")

    assert hashed != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed)
    assert not verify_password("incorrect", hashed)


def test_access_token_contains_subject_and_expiry() -> None:
    token = create_access_token("9df4f84e-a9d0-4933-b7c8-87f472035838")
    claims = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )

    assert claims["sub"] == "9df4f84e-a9d0-4933-b7c8-87f472035838"
    assert claims["exp"] > claims["iat"]
