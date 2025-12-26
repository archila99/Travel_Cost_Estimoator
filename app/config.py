from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables."""
    
    # Google Maps API
    google_maps_api_key: str
    
    # Database
    database_url: str
    
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
        case_sensitive=False
    )


# Global settings instance
settings = Settings()
