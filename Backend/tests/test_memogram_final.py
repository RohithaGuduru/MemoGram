import pytest
from datetime import date, datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.caregiver import Caregiver
from app.models.patient import Patient
from app.models.relationship import PatientCaretakerRelationship
from app.models.game import Game
from app.models.medication import Medication
from app.models.reminder import Reminder, ReminderLog
from app.models.language_capability import LanguageCapability
from app.models.sos_alert import SOSAlert
from app.models.notification import Notification
from app.utils.enums import UserRole, RelationshipStatus, GameCategory, SOSStatus, MedicationActionType, ReminderType


@pytest.fixture
def memogram_db_setup(db: Session):
    now = datetime.now(timezone.utc)

    # 1. Caretaker User
    cg_user = User(
        email="caretaker.priya@memogram.app",
        phone="+919876543299",
        hashed_password=get_password_hash("Caregiver@123"),
        full_name="Priya Sharma",
        role=UserRole.CARETAKER,
        is_active=True,
    )
    db.add(cg_user)
    db.flush()

    cg = Caregiver(
        user_id=cg_user.id,
        relationship_with_patient="Primary Caretaker",
        notes="Senior elder assistant",
    )
    db.add(cg)
    db.flush()

    # 2. Patient User
    pt_user = User(
        email="patient.ananya@memogram.app",
        phone="+919876543288",
        hashed_password=get_password_hash("Patient@123"),
        full_name="Ananya Das",
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(pt_user)
    db.flush()

    pt = Patient(
        user_id=pt_user.id,
        date_of_birth=date(1950, 4, 15),
        gender="Female",
        primary_language="as",
        fallback_language="en",
        preferred_language="as",
        emergency_contact_name="Rahul Das",
        emergency_contact_phone="+919811122233",
    )
    db.add(pt)
    db.flush()

    # 3. Active Relationship
    rel = PatientCaretakerRelationship(
        caregiver_id=cg.id,
        patient_id=pt.id,
        relation_type="primary_caretaker",
        status=RelationshipStatus.ACTIVE,
        is_primary=True,
    )
    db.add(rel)

    # 4. Medication & Reminder
    med = Medication(
        patient_id=pt.id,
        name="Donepezil",
        dosage="5mg",
        time_of_day="08:00 AM",
        frequency="daily",
        start_date=date(2026, 1, 1),
        instructions="Take with breakfast",
        is_active=True,
    )
    db.add(med)
    db.flush()

    rem = Reminder(
        patient_id=pt.id,
        medication_id=med.id,
        title="Morning Medicine",
        description="Take 1 tablet of Donepezil 5mg",
        reminder_type=ReminderType.MEDICATION,
        scheduled_time=datetime.now().time(),
        is_active=True,
    )
    db.add(rem)

    # 5. Core Game
    game = Game(
        code="MEM_SHOPPING",
        name="Memory Shopping",
        category=GameCategory.MEMORY,
        description="Recall items from your weekly shopping list.",
        min_difficulty=1,
        max_difficulty=5,
        default_config={"items_count": 4},
        is_active=True,
    )
    db.add(game)

    db.commit()

    cg_token = create_access_token(subject=cg_user.id, role=UserRole.CARETAKER.value)
    pt_token = create_access_token(subject=pt_user.id, role=UserRole.PATIENT.value)

    return {
        "cg_user": cg_user,
        "cg_profile": cg,
        "pt_user": pt_user,
        "pt_profile": pt,
        "rel": rel,
        "med": med,
        "game": game,
        "cg_token": cg_token,
        "pt_token": pt_token,
    }


# =============================================================================
# 1. Auth & Google Login Tests
# =============================================================================
def test_google_login_flow(client: TestClient, db: Session):
    payload = {
        "id_token": "mock_token_ananya_google",
        "role": "PATIENT",
        "full_name": "Ananya Google",
        "preferred_language": "as",
    }
    resp = client.post("/api/v1/auth/google", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "PATIENT"


def test_logout_endpoint(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    resp = client.post("/api/v1/auth/logout", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_patient_registration_direct(client: TestClient, db: Session):
    payload = {
        "email": "new.patient@memogram.app",
        "password": "Password@123",
        "full_name": "New Patient User",
        "role": "PATIENT",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "PATIENT"


# =============================================================================
# 2. Patient-Caretaker Relationship & Secure OTP Tests
# =============================================================================
def test_relationship_invitation_and_otp_verification(client: TestClient, db: Session, memogram_db_setup):
    # 1. Create a second patient not yet connected
    p2_user = User(
        email="unconnected.patient@memogram.app",
        hashed_password=get_password_hash("Pass@123"),
        full_name="Unconnected Patient",
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(p2_user)
    db.flush()
    p2 = Patient(user_id=p2_user.id, primary_language="as")
    db.add(p2)
    db.commit()

    headers = {"Authorization": f"Bearer {memogram_db_setup['cg_token']}"}

    # 2. Caretaker sends invitation
    invite_payload = {
        "patient_email_or_phone": "unconnected.patient@memogram.app",
        "relation_type": "family_caretaker",
    }
    resp = client.post("/api/v1/relationships/invite", json=invite_payload, headers=headers)
    assert resp.status_code == 201
    invite_data = resp.json()
    rel_id = invite_data["relationship_id"]
    assert invite_data["status"] == "PENDING"
    assert invite_data["expires_in_minutes"] == 10

    # Ensure plaintext OTP is available in test mode or fallback mock code
    otp_code = invite_data.get("test_otp_code") or "123456"

    # 3. Test Invalid OTP rejection and attempts counter
    bad_verify = client.post("/api/v1/relationships/verify-otp", json={"relationship_id": rel_id, "otp_code": "000000"}, headers=headers)
    assert bad_verify.status_code == 400
    assert "Invalid verification code" in bad_verify.json()["detail"]

    # 4. Test Valid OTP verification
    good_verify = client.post("/api/v1/relationships/verify-otp", json={"relationship_id": rel_id, "otp_code": otp_code}, headers=headers)
    assert good_verify.status_code == 200
    assert good_verify.json()["status"] == "ACTIVE"


def test_unassigned_caretaker_forbidden_isolation(client: TestClient, db: Session, memogram_db_setup):
    # Create an unconnected caretaker
    rogue_user = User(
        email="rogue.caretaker@example.com",
        hashed_password=get_password_hash("Pass@123"),
        full_name="Rogue Caretaker",
        role=UserRole.CARETAKER,
        is_active=True,
    )
    db.add(rogue_user)
    db.flush()
    cg_rogue = Caregiver(user_id=rogue_user.id)
    db.add(cg_rogue)
    db.commit()

    rogue_token = create_access_token(subject=rogue_user.id, role=UserRole.CARETAKER.value)
    headers = {"Authorization": f"Bearer {rogue_token}"}

    # Attempt to view patient data of Priya's patient
    pt_id = memogram_db_setup["pt_profile"].id
    resp = client.get(f"/api/v1/patients/{pt_id}", headers=headers)
    assert resp.status_code == 403
    assert "Unauthorized" in resp.json()["detail"]


# =============================================================================
# 3. Language Capability Registry Tests
# =============================================================================
def test_language_registry_capabilities(client: TestClient, db: Session):
    resp = client.get("/api/v1/languages")
    assert resp.status_code == 200
    languages = resp.json()
    assert len(languages) >= 7

    # Check Assamese capabilities
    as_lang = next(l for l in languages if l["language_code"] == "as")
    assert as_lang["display_name"] == "Assamese"
    assert as_lang["text_available"] is True
    assert as_lang["capabilities"]["stt"]["available"] is True
    assert as_lang["capabilities"]["stt"]["provider"] == "sarvam"
    assert as_lang["capabilities"]["tts"]["available"] is False

    # Check Mizo in-development status
    mizo_lang = next(l for l in languages if l["language_code"] == "mizo")
    assert mizo_lang["display_name"] == "Mizo"
    assert mizo_lang["status"] == "IN_DEVELOPMENT"
    assert mizo_lang["capabilities"]["tts"]["available"] is False

    # Check Bodo and Manipuri provider routing
    bodo_lang = next(l for l in languages if l["language_code"] == "brx")
    assert bodo_lang["capabilities"]["tts"]["provider"] == "indic_parler"
    mni_lang = next(l for l in languages if l["language_code"] == "mni")
    assert mni_lang["capabilities"]["tts"]["provider"] == "indic_parler"


def test_language_detail_endpoint(client: TestClient, db: Session):
    resp = client.get("/api/v1/languages/mizo")
    assert resp.status_code == 200
    data = resp.json()
    assert data["language_code"] == "mizo"
    assert data["status"] == "IN_DEVELOPMENT"


@pytest.mark.asyncio
async def test_indic_parler_tts_provider():
    from app.services.providers.indic_parler_provider import IndicParlerTTSProvider

    # 1. Disabled mode -> returns IN_DEVELOPMENT
    provider_disabled = IndicParlerTTSProvider(enabled=False)
    res_dis = await provider_disabled.synthesize("मोजां", "brx")
    assert res_dis.available is False
    assert res_dis.status == "IN_DEVELOPMENT"
    assert "under development" in res_dis.message

    # 2. Enabled mode -> returns AVAILABLE with audio payload
    provider_enabled = IndicParlerTTSProvider(enabled=True)
    res_bodo = await provider_enabled.synthesize("मोजां", "brx")
    assert res_bodo.available is True
    assert res_bodo.status == "AVAILABLE"
    assert res_bodo.audio_base64 is not None

    res_mni = await provider_enabled.synthesize("ꯅꯨꯡꯉꯥꯏꯕ", "mni")
    assert res_mni.available is True
    assert res_mni.status == "AVAILABLE"


# =============================================================================
# 4. Mobile Voice Pipeline Tests
# =============================================================================
def test_voice_process_medication_query(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    payload = {
        "patient_id": memogram_db_setup["pt_profile"].id,
        "language": "as",
        "transcript_text": "মই ঔষধ কেতিয়া খাব লাগিব?",
    }
    resp = client.post("/api/v1/voice/process", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "MEDICATION_SCHEDULE"
    assert "Donepezil" in data["reply_text"]
    assert data["tool_executed"] == "get_medication_schedule"
    # Assamese TTS is in development -> honest status without faking
    assert data["tts_status"] == "IN_DEVELOPMENT"
    assert "under development" in data["tts_message"]


def test_voice_process_hindi_intent(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    payload = {
        "patient_id": memogram_db_setup["pt_profile"].id,
        "language": "hi",
        "transcript_text": "मेरी अगली दवाई कब है?",
    }
    resp = client.post("/api/v1/voice/process", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "MEDICATION_SCHEDULE"
    assert "दवाई" in data["reply_text"]


# =============================================================================
# 5. Core 5 Memogram Games & Content Generation
# =============================================================================
def test_list_games_contains_core_memogram_games(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    resp = client.get("/api/v1/games", headers=headers)
    assert resp.status_code == 200
    games = resp.json()
    codes = [g["code"] for g in games]
    assert "MEM_SHOPPING" in codes


def test_game_content_generation(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    payload = {
        "game_code": "MEM_SHOPPING",
        "difficulty": 1,
        "theme": "regional_market",
        "language": "as",
    }
    resp = client.post("/api/v1/games/content/generate", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["game_code"] == "MEM_SHOPPING"
    assert len(data["items"]) >= 1
    assert "title" in data


# =============================================================================
# 6. Medication Actions: Took It & Remind Me Later
# =============================================================================
def test_patient_took_it_action(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    med_id = memogram_db_setup["med"].id
    pt_id = memogram_db_setup["pt_profile"].id

    payload = {
        "action": "TOOK_IT",
        "notes": "Taken with a glass of water",
    }
    resp = client.post(f"/api/v1/medicines/{med_id}/action?patient_id={pt_id}", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["action_recorded"] == "TOOK_IT"
    assert data["status"] == "TAKEN"


def test_patient_remind_later_action(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    med_id = memogram_db_setup["med"].id
    pt_id = memogram_db_setup["pt_profile"].id

    payload = {
        "action": "REMIND_LATER",
    }
    resp = client.post(f"/api/v1/medicines/{med_id}/action?patient_id={pt_id}", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["action_recorded"] == "REMIND_LATER"
    assert data["status"] == "SNOOZED"


# =============================================================================
# 7. SOS Emergency Assistance & Notifications
# =============================================================================
def test_sos_trigger_and_notification_dispatch(client: TestClient, db: Session, memogram_db_setup):
    headers_pt = {"Authorization": f"Bearer {memogram_db_setup['pt_token']}"}
    headers_cg = {"Authorization": f"Bearer {memogram_db_setup['cg_token']}"}
    pt_id = memogram_db_setup["pt_profile"].id

    # 1. Trigger SOS
    sos_payload = {
        "patient_id": pt_id,
        "latitude": 26.1445,
        "longitude": 91.7362,
        "message": "Emergency assistance requested.",
    }
    resp = client.post("/api/v1/sos/trigger", json=sos_payload, headers=headers_pt)
    assert resp.status_code == 201
    sos_data = resp.json()
    sos_id = sos_data["id"]
    assert sos_data["status"] == "TRIGGERED"

    # 2. Caretaker retrieves SOS list
    sos_list = client.get("/api/v1/sos", headers=headers_cg)
    assert sos_list.status_code == 200
    assert len(sos_list.json()) >= 1

    # 3. Caretaker retrieves notification
    notifs = client.get("/api/v1/notifications", headers=headers_cg)
    assert notifs.status_code == 200
    assert len(notifs.json()) >= 1
    assert notifs.json()[0]["notification_type"] == "SOS"

    # 4. Resolve SOS
    resolve_resp = client.patch(f"/api/v1/sos/{sos_id}/resolve", headers=headers_cg)
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "RESOLVED"


# =============================================================================
# 8. Adaptive Difficulty Evaluation Endpoint
# =============================================================================
def test_adaptive_difficulty_endpoint(client: TestClient, memogram_db_setup):
    headers = {"Authorization": f"Bearer {memogram_db_setup['cg_token']}"}
    pt_id = memogram_db_setup["pt_profile"].id
    game_id = memogram_db_setup["game"].id

    resp = client.get(f"/api/v1/adaptive/evaluate/{pt_id}/{game_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommended_difficulty" in data
    assert "action" in data
    assert "reason" in data


# =============================================================================
# 9. System Health Check Endpoint
# =============================================================================
def test_health_check_endpoint(client: TestClient):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["project"] == "MEMOGRAM"
    assert "ai_providers" in data
