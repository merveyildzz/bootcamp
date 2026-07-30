from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database — a single SQLite file, no separate server/driver/credentials to set up.
    database_path: str = "data/style_mind.db"

    # JWT
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # Uploads
    upload_dir: str = "uploads"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # AI (Faz 2+)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"

    # Wardrobe uploads
    max_upload_size_bytes: int = 8 * 1024 * 1024
    staging_max_age_hours: int = 24

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path}"


settings = Settings()
