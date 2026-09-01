from fastapi import status


def test_register_caregiver(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "new_caregiver@example.com",
            "password": "SecurePassword123",
            "full_name": "Dr. Anita Roy",
            "role": "CAREGIVER",
            "agency": "Shillong Care Unit",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "CAREGIVER"


def test_login_success(client, seed_test_data):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": "caregiver_test@example.com",
            "password": "Caregiver@123",
        },
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "access_token" in data
    assert data["user_id"] == seed_test_data["caregiver_user"].id


def test_login_invalid_password(client):
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": "caregiver_test@example.com",
            "password": "WrongPassword",
        },
    )
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_me(client, caregiver_auth_headers):
    res = client.get("/api/v1/auth/me", headers=caregiver_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["email"] == "caregiver_test@example.com"
    assert data["role"] == "CAREGIVER"
    assert data["caregiver_id"] is not None
