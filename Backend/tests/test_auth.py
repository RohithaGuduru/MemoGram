from datetime import datetime, timezone, timedelta
from fastapi import status
from app.services.email_service import EmailService
from app.models.password_reset import PasswordResetToken


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


def test_forgot_password_existing_user(client, seed_test_data):
    EmailService.clear_test_otps()
    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "caregiver_test@example.com"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "reset code has been sent" in data["message"]
    otp = EmailService.get_last_otp_for_test("caregiver_test@example.com")
    assert otp is not None
    assert len(otp) == 6
    assert otp.isdigit()


def test_forgot_password_non_existent_user(client):
    EmailService.clear_test_otps()
    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "unknown_user@example.com"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "reset code has been sent" in data["message"]
    otp = EmailService.get_last_otp_for_test("unknown_user@example.com")
    assert otp is None


def test_forgot_password_case_insensitive(client, seed_test_data):
    EmailService.clear_test_otps()
    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "CAREGIVER_TEST@EXAMPLE.COM"},
    )
    assert res.status_code == status.HTTP_200_OK
    otp = EmailService.get_last_otp_for_test("caregiver_test@example.com")
    assert otp is not None


def test_reset_password_caregiver_flow(client, seed_test_data):
    EmailService.clear_test_otps()
    # 1. Request OTP
    req_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "caregiver_test@example.com"},
    )
    assert req_res.status_code == status.HTTP_200_OK
    otp = EmailService.get_last_otp_for_test("caregiver_test@example.com")
    assert otp is not None

    # 2. Reset password
    reset_res = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "caregiver_test@example.com",
            "otp": otp,
            "new_password": "NewSecureCaregiverPass@2026",
        },
    )
    assert reset_res.status_code == status.HTTP_200_OK
    assert reset_res.json()["message"] == "Password reset successful."

    # 3. Old password should fail
    old_login = client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": "caregiver_test@example.com",
            "password": "Caregiver@123",
        },
    )
    assert old_login.status_code == status.HTTP_401_UNAUTHORIZED

    # 4. New password should succeed
    new_login = client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": "caregiver_test@example.com",
            "password": "NewSecureCaregiverPass@2026",
        },
    )
    assert new_login.status_code == status.HTTP_200_OK
    assert "access_token" in new_login.json()


def test_reset_password_patient_flow(client, seed_test_data):
    EmailService.clear_test_otps()
    # 1. Request OTP for patient
    req_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "patient_test@example.com"},
    )
    assert req_res.status_code == status.HTTP_200_OK
    otp = EmailService.get_last_otp_for_test("patient_test@example.com")
    assert otp is not None

    # 2. Reset password
    reset_res = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "patient_test@example.com",
            "otp": otp,
            "new_password": "NewPatientPass@2026",
        },
    )
    assert reset_res.status_code == status.HTTP_200_OK

    # 3. New password login succeeds
    new_login = client.post(
        "/api/v1/auth/login",
        json={
            "email_or_phone": "patient_test@example.com",
            "password": "NewPatientPass@2026",
        },
    )
    assert new_login.status_code == status.HTTP_200_OK
    assert new_login.json()["role"] == "PATIENT"


def test_reset_password_invalid_otp(client, seed_test_data):
    EmailService.clear_test_otps()
    client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "caregiver_test@example.com"},
    )
    res = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "caregiver_test@example.com",
            "otp": "999999",
            "new_password": "NewPassword@123",
        },
    )
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid reset code" in res.json()["detail"]


def test_reset_password_otp_reuse_rejected(client, seed_test_data):
    EmailService.clear_test_otps()
    client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "caregiver_test@example.com"},
    )
    otp = EmailService.get_last_otp_for_test("caregiver_test@example.com")
    # First reset succeeds
    res1 = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "caregiver_test@example.com",
            "otp": otp,
            "new_password": "FirstNewPassword@123",
        },
    )
    assert res1.status_code == status.HTTP_200_OK

    # Second reset with identical OTP must fail
    res2 = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "caregiver_test@example.com",
            "otp": otp,
            "new_password": "SecondNewPassword@123",
        },
    )
    assert res2.status_code == status.HTTP_400_BAD_REQUEST


def test_reset_password_expired_token(client, db, seed_test_data):
    EmailService.clear_test_otps()
    client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "caregiver_test@example.com"},
    )
    otp = EmailService.get_last_otp_for_test("caregiver_test@example.com")
    assert otp is not None

    # Manually expire the token in the database
    token_record = db.query(PasswordResetToken).first()
    assert token_record is not None
    token_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    # Attempt reset
    res = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "caregiver_test@example.com",
            "otp": otp,
            "new_password": "ExpiredPassword@123",
        },
    )
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "expired" in res.json()["detail"].lower()


def test_reset_password_max_attempts(client, seed_test_data):
    EmailService.clear_test_otps()
    client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "caregiver_test@example.com"},
    )
    otp = EmailService.get_last_otp_for_test("caregiver_test@example.com")
    assert otp is not None

    # Fail 5 times
    for _ in range(5):
        res = client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": "caregiver_test@example.com",
                "otp": "000000",
                "new_password": "AttemptPassword@123",
            },
        )
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    # Now even the correct OTP should be rejected as max attempts were exceeded
    res_correct = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "caregiver_test@example.com",
            "otp": otp,
            "new_password": "AttemptPassword@123",
        },
    )
    assert res_correct.status_code == status.HTTP_400_BAD_REQUEST

