"""
Backend Authentication & Profile Unit Tests
"""
import pytest
from app.core.security import verify_password, hash_password, decode_access_token


@pytest.mark.asyncio
async def test_argon2id_hashing():
    raw_pwd = "SuperSecretPassword99!"
    hashed = hash_password(raw_pwd)
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


@pytest.mark.asyncio
async def test_register_success(client):
    payload = {
        "name": "Kavita Rao",
        "email": "kavita.rao@example.com",
        "password": "PasswordSecure123!",
        "profile": {
            "target_role": "Backend Engineer (Go)",
            "target_level": "L4",
            "experience_years": 2,
            "primary_language": "Go"
        }
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "kavita.rao@example.com"
    assert data["user"]["name"] == "Kavita Rao"


@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_user):
    payload = {
        "name": "Arjun Duplicate",
        "email": test_user["email"],
        "password": "Password123!"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client, test_user):
    payload = {
        "email": test_user["email"],
        "password": "ValidPassword123!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == test_user["id"]


@pytest.mark.asyncio
async def test_login_invalid_password(client, test_user):
    payload = {
        "email": test_user["email"],
        "password": "IncorrectPassword999"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_profile(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Arjun Patel"
    assert data["email"] == "arjun.patel@example.com"


@pytest.mark.asyncio
async def test_update_profile(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    update_payload = {
        "name": "Arjun Patel (Updated)",
        "profile": {
            "target_role": "Staff Distributed Systems Architect",
            "target_level": "L6",
            "experience_years": 7,
            "primary_language": "Java"
        }
    }
    response = await client.put("/api/v1/auth/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Arjun Patel (Updated)"
    assert data["profile"]["target_level"] == "L6"


@pytest.mark.asyncio
async def test_delete_account(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.delete("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Confirm user can no longer authenticate
    followup = await client.get("/api/v1/auth/me", headers=headers)
    assert followup.status_code == 401
