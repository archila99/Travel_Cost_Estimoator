from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables."""
    
    # OpenRouteService API (routing + geocoding)
    openrouteservice_api_key: str
    
    # Database
    database_url: str

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_postgres_scheme(cls, v: str) -> str:
        """Supabase and others may use postgres://; SQLAlchemy expects postgresql://."""
        if isinstance(v, str) and v.startswith("postgres://"):
            return "postgresql://" + v[len("postgres://") :]
        return v

    # Security
    secret_key: str
    registration_key: Optional[str] = None

    # CORS: comma-separated origins (e.g. https://your-app.vercel.app). Required for browser
    # requests from a separate frontend (Vercel) with Authorization headers against this API.
    cors_origins: Optional[str] = None
    
    # Application defaults
    fuel_price_default: float = 1.50
    cache_enabled: bool = False
    rate_limit_enabled: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Global settings instance
settings = Settings()
