"""Application settings.

Every field carries a working development default so the service boots on a
clean checkout with no .env file present. Secrets fall back to a clearly
marked `cenius-dev-*` value that is identical at every read site.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ — the SQLite file and .env live here, independent of the CWD.
BASE_DIR = Path(__file__).resolve().parent.parent

DEV_JWT_SECRET = "cenius-dev-8f42c1d9b6a35e07"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = f"sqlite:///{BASE_DIR / 'ropewalk.db'}"
    jwt_secret: str = DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "ropewalk-cordage"
    jwt_expires_minutes: int = 720
    cors_origins: str = "*"

    demo_email: str = "cenius@cenius.ai"
    demo_username: str = "cenius"
    demo_password: str = "cenius"


settings = Settings()
