from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "NEXORA"
    app_env: str = "development"
    debug: bool = True

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
