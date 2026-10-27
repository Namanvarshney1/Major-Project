"""
PrepPulse Core Configuration Module
Manages typed environment settings using Pydantic Settings.
"""
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Metadata
    PROJECT_NAME: str = "PrepPulse"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & JWT Auth
    JWT_SECRET: str = Field(
        default="preppulse-super-secure-production-jwt-secret-key-32chars-min!",
        description="Cryptographic secret key for signing JWT tokens"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string (local or MongoDB Atlas)"
    )
    MONGODB_DATABASE: str = "preppulse_db"

    # AI & Groq Configuration
    GROQ_API_KEY: str = Field(
        default="",
        description="Groq Cloud API Key for Llama-3 model inference"
    )
    GROQ_MODEL: str = Field(
        default="llama-3.3-70b-versatile",
        description="Supported Llama model identifier on Groq Cloud"
    )

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
