"""Application configuration loaded from environment variables."""

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    """NEXORA application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NEXORA"
    app_env: str = "development"
    debug: bool = True

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    # AI provider selection
    ai_provider: str = "ollama"

    # Public AI endpoint protection
    ai_rate_limit_requests: int = 5
    ai_rate_limit_window_seconds: float = 60.0

    # Ollama configuration
    ollama_base_url: str = (
        "http://127.0.0.1:11434"
    )
    ollama_model: str = "qwen3.5:4b"
    ollama_timeout_seconds: float = 120.0
    ollama_api_key: str | None = None

    # Gemini configuration
    gemini_base_url: str = (
        "https://generativelanguage.googleapis.com"
    )
    gemini_model: str = "gemini-3.1-flash-lite"
    gemini_timeout_seconds: float = 120.0
    gemini_api_key: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins as a clean list."""

        return [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()