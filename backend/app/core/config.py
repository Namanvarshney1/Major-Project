"""
PrepPulse Core Configuration Module
Manages typed environment settings using Pydantic Settings.
Implements predictable precedence: OS Environment Variables > Project Root .env > Backend .env > Defaults.
"""
import os
import re
from pathlib import Path
from typing import List, Union, Any, Optional
from urllib.parse import urlsplit, urlunsplit
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine explicit env_file hierarchy
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

# Select primary environment file
if os.getenv("ENV_FILE") and Path(os.getenv("ENV_FILE")).is_file():
    _PRIMARY_ENV_FILE = os.getenv("ENV_FILE")
elif (_PROJECT_ROOT / ".env").is_file():
    _PRIMARY_ENV_FILE = str(_PROJECT_ROOT / ".env")
elif (_BACKEND_DIR / ".env").is_file():
    _PRIMARY_ENV_FILE = str(_BACKEND_DIR / ".env")
else:
    _PRIMARY_ENV_FILE = ".env"


def mask_mongo_uri(uri: str) -> str:
    """
    Safely masks username:password credentials in a MongoDB URI string.
    Ensures passwords and secrets are never printed to logs or standard output.
    """
    if not uri:
        return "<empty>"
    try:
        parts = urlsplit(uri)
        if parts.password:
            masked_netloc = f"{parts.username}:****@{parts.hostname or ''}"
            if parts.port:
                masked_netloc += f":{parts.port}"
            return urlunsplit((parts.scheme, masked_netloc, parts.path, parts.query, parts.fragment))
        return uri
    except Exception:
        if "@" in uri:
            prefix, rest = uri.split("@", 1)
            scheme_and_auth = prefix.split("://", 1)
            if len(scheme_and_auth) == 2:
                scheme, auth = scheme_and_auth
                user = auth.split(":", 1)[0] if ":" in auth else "user"
                return f"{scheme}://{user}:****@{rest}"
        return "<masked_uri>"


def mask_secret(secret: str) -> str:
    """Masks cryptographic secrets or API keys for safe logging."""
    if not secret:
        return "<empty>"
    if len(secret) <= 8:
        return "****"
    return f"{secret[:4]}...{secret[-4:]}"


class Settings(BaseSettings):
    # Application Metadata
    PROJECT_NAME: str = "PrepPulse"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Security & JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default="preppulse-super-secure-production-jwt-secret-key-32chars-min!",
        description="Cryptographic secret key for signing JWT tokens",
        validation_alias=AliasChoices("JWT_SECRET_KEY", "JWT_SECRET")
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    @property
    def JWT_SECRET(self) -> str:
        """Backward compatibility alias for JWT_SECRET_KEY."""
        return self.JWT_SECRET_KEY

    # Database Configuration
    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string (local or MongoDB Atlas)"
    )
    MONGODB_DATABASE: str = "preppulse_db"
    ALLOW_MOCK_DB: bool = Field(
        default=False,
        description="Explicitly allow in-memory mock fallback in development or offline tests"
    )

    # AI & Groq Provider Configuration
    GROQ_API_KEY: str = Field(
        default="",
        description="Groq Cloud API Key for model inference"
    )
    GROQ_MODEL: str = Field(
        default="openai/gpt-oss-120b",
        description="Supported model identifier on Groq Cloud"
    )

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # CORS & Security Gateways
    FRONTEND_ORIGINS: Union[str, List[str]] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        validation_alias=AliasChoices("FRONTEND_ORIGINS", "BACKEND_CORS_ORIGINS")
    )

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        """Returns clean list of allowed CORS origins."""
        if isinstance(self.FRONTEND_ORIGINS, list):
            return self.FRONTEND_ORIGINS
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=_PRIMARY_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def validate_startup(self) -> None:
        """Validates critical settings at startup without leaking credentials."""
        from app.core.logging import logger

        logger.info(f"Loaded configuration from: {_PRIMARY_ENV_FILE}")
        logger.info(f"Environment: {self.ENVIRONMENT} (Debug: {self.DEBUG})")
        logger.info(f"Database Target: {self.MONGODB_DATABASE} at {mask_mongo_uri(self.MONGODB_URI)}")
        logger.info(f"Groq Model Target: {self.GROQ_MODEL} (Key Configured: {bool(self.GROQ_API_KEY)})")
        logger.info(f"CORS Allowed Origins: {self.BACKEND_CORS_ORIGINS}")

        # Basic integrity checks
        if len(self.JWT_SECRET_KEY) < 16:
            logger.warning("JWT_SECRET_KEY is shorter than 16 characters. Use a secure random 32+ character key for production.")

        if self.ENVIRONMENT == "production":
            if not self.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY must be configured in production environment.")
            if "localhost" in self.MONGODB_URI and not self.ALLOW_MOCK_DB:
                logger.warning("Production environment is configured with localhost MONGODB_URI.")


settings = Settings()
