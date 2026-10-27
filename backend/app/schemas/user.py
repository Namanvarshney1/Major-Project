"""
User Pydantic Schemas for Authentication and Profile Management
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class UserProfile(BaseModel):
    target_role: str = Field(default="Senior Backend Engineer (Java & Distributed Systems)")
    target_level: str = Field(default="L5/Senior IC")
    experience_years: int = Field(default=4, ge=0, le=50)
    primary_language: str = Field(default="Java")


class UserPreferences(BaseModel):
    theme: str = Field(default="light")
    timed_mode_default: bool = Field(default=True)
    sound_enabled: bool = Field(default=True)


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    profile: Optional[UserProfile] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    profile: UserProfile
    preferences: UserPreferences
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile: Optional[UserProfile] = None
    preferences: Optional[UserPreferences] = None
