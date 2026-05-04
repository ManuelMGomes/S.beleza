from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "GenOmni Salon API"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql://saas:saas123@db:5432/saas_db"
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = "supersecret"
    access_token_expire_minutes: int = 60 * 12
    cache_ttl_seconds: int = 60
    cors_origins: str = "http://localhost:8080,http://localhost:5173,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
