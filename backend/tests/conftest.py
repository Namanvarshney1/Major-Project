"""
Pytest Fixtures and Async Test Harness for PrepPulse Backend
"""
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.db.mongodb import db_manager
from app.db.indexes import create_db_indexes
from app.core.security import hash_password, create_access_token
from app.core.config import settings
from app.ai.llm import llm_client

# Ensure tests run with offline fallback mode and mock DB without hanging on external network calls
settings.GROQ_API_KEY = ""
settings.ALLOW_MOCK_DB = True
llm_client._client = None
llm_client._api_key = ""


@pytest_asyncio.fixture(scope="function")
async def mock_db():
    """Provides a fresh isolated in-memory MongoDB database for each test."""
    client = AsyncMongoMockClient()
    db = client["preppulse_test_db"]
    db_manager.client = client
    db_manager.db = db
    db_manager.is_mock = True
    await create_db_indexes(db)
    yield db
    client.close()


@pytest_asyncio.fixture(scope="function")
async def client(mock_db):
    """Provides an async HTTP client configured against the FastAPI ASGI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def test_user(mock_db):
    """Creates a standard test user in the test database."""
    now = datetime.now(timezone.utc)
    user_dict = {
        "name": "Arjun Patel",
        "email": "arjun.patel@example.com",
        "password_hash": hash_password("ValidPassword123!"),
        "profile": {
            "target_role": "Senior Backend Engineer (Java & Distributed Systems)",
            "target_level": "L5/Senior IC",
            "experience_years": 4,
            "primary_language": "Java"
        },
        "preferences": {
            "theme": "light",
            "timed_mode_default": True,
            "sound_enabled": True
        },
        "created_at": now,
        "updated_at": now
    }
    user = await mock_db.users.insert_one(user_dict)
    user_dict["id"] = str(user.inserted_id)
    return user_dict


@pytest_asyncio.fixture(scope="function")
async def user_token(test_user):
    """Generates a valid JWT access token for test_user."""
    return create_access_token({"sub": test_user["id"], "email": test_user["email"]})


@pytest_asyncio.fixture(scope="function")
async def other_user(mock_db):
    """Creates a second distinct candidate user to verify cross-user isolation."""
    now = datetime.now(timezone.utc)
    user_dict = {
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "password_hash": hash_password("OtherPassword123!"),
        "profile": {
            "target_role": "Staff Distributed Systems Architect",
            "target_level": "L6",
            "experience_years": 8,
            "primary_language": "Go"
        },
        "preferences": {
            "theme": "dark",
            "timed_mode_default": False,
            "sound_enabled": True
        },
        "created_at": now,
        "updated_at": now
    }
    user = await mock_db.users.insert_one(user_dict)
    user_dict["id"] = str(user.inserted_id)
    return user_dict


@pytest_asyncio.fixture(scope="function")
async def other_token(other_user):
    """Generates an access token for other_user."""
    return create_access_token({"sub": other_user["id"], "email": other_user["email"]})
