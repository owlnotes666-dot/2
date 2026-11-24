from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",


    )

    app_name: str = "Medical Dashboard AI"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    frontend_origin: str = "http://localhost:3000"

    supabase_url: str
    supabase_anon_key: SecretStr

    hf_token: SecretStr | None = None
    openrouter_api_key: SecretStr | None = None
    jina_api_key: SecretStr | None = None
    tavily_api_key: SecretStr | None = None
    ai_provider: Literal["huggingface", "openrouter", "jina"] = "openrouter"
    ai_model: str = "nvidia/nemotron-3-ultra-550b-a55b:free"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
