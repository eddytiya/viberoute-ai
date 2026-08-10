import time

from jose import JWTError, jwt

from app.core.config import get_settings

ALGORITHM = "HS256"


def create_session_token(data: dict) -> str:
    settings = get_settings()
    payload = data.copy()
    payload["iat"] = int(time.time())
    return jwt.encode(payload, settings.session_secret_key, algorithm=ALGORITHM)


def decode_session_token(token: str) -> dict | None:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.session_secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
