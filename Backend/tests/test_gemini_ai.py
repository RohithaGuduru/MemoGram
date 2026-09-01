import pytest
from datetime import date, datetime, timezone, time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.patient import Patient
from app.models.medication import Medication
from app.models.reminder import Reminder, ReminderLog
from app.models.family_member import FamilyMember
from app.models.game import Game
from app.models.game_session import GameSession
from app.models.performance_metric import PerformanceMetric
from app.models.baseline import Baseline
from app.models.performance_trend import PerformanceTrend
from app.models.ai_insight import AIInsight
from app.utils.enums import GameCategory, ReminderType, SessionStatus, TrendDirection
from app.services.ai_tools_service import AIToolsService
from app.services.gemini_service import GeminiService
from app.services.voice_assistant_service import VoiceAssistantService
from app.services.ai_insights_service import AIInsightsService


@pytest.fixture
def populated_patient_db(db: Session, seed_test_data):
    """Populates test database with medication, reminders, performance metrics, and family members."""
    patient = seed_test_data["patient"]
    game = seed_test_data["game"]
    now = datetime.now(timezone.utc)

    # Add Medication
    med = Medication(
        patient_id=patient.id,
        name="Donepezil",
        dosage="5mg",
        time_of_day="08:00 Morning",
        frequency="daily",
        start_date=date(2025, 1, 1),
        instructions="Take 1 tablet with water after breakfast",
        is_active=True,
    )
    db.add(med)

    # Add Reminder
    rem = Reminder(
        patient_id=patient.id,
        medication_id=med.id,
        title="Morning Medicine",
        description="Take morning Donepezil 5mg tablet",
        reminder_type=ReminderType.MEDICATION,
        scheduled_time=time(8, 0),
        recurrence_rule="DAILY",
        is_active=True,
    )
    db.add(rem)
    db.flush()

    # Add Reminder Log (Completed today)
    log = ReminderLog(
        reminder_id=rem.id,
        patient_id=patient.id,
        scheduled_for=now,
        completed_at=now,
        status="COMPLETED",
    )
    db.add(log)

    # Add Doctor Appointment Reminder
    appt = Reminder(
        patient_id=patient.id,
        title="Dr. Sharma Clinic Consultation",
        description="Routine quarterly health review",
        reminder_type=ReminderType.APPOINTMENT,
        scheduled_time=time(11, 30),
        recurrence_rule="ONCE",
        is_active=True,
    )
    db.add(appt)

    # Add Family Member
    fam = FamilyMember(
        patient_id=patient.id,
        name="Anupam Bora",
        relation="Son",
        phone="+919876543210",
        notes="Primary family contact",
        is_emergency_contact=True,
    )
    db.add(fam)

    # Add Game Session & Metric
    sess = GameSession(
        client_session_id="client_sess_ai_001",
        patient_id=patient.id,
        game_id=game.id,
        game_category=GameCategory.MEMORY,
        difficulty=2,
        started_at=now,
        completed_at=now,
        status=SessionStatus.COMPLETED,
    )
    db.add(sess)
    db.flush()

    metric = PerformanceMetric(
        session_id=sess.id,
        patient_id=patient.id,
        game_id=game.id,
        game_category=GameCategory.MEMORY,
        difficulty=2,
        accuracy=85.0,
        error_rate=15.0,
        average_response_time_ms=3200.0,
        median_response_time_ms=3000.0,
        hint_rate=0.0,
        completion_rate=100.0,
        attempts=1,
        created_at=now,
    )
    db.add(metric)

    # Add Baseline
    base = Baseline(
        patient_id=patient.id,
        game_category=GameCategory.MEMORY,
        difficulty_level=2,
        baseline_accuracy=80.0,
        baseline_response_time_ms=3500.0,
        baseline_error_rate=20.0,
        baseline_hint_rate=0.0,
        baseline_completion_rate=100.0,
        sample_count=5,
        last_updated_at=now,
    )
    db.add(base)

    # Add Trend
    trend = PerformanceTrend(
        patient_id=patient.id,
        game_category=GameCategory.MEMORY,
        metric_name="accuracy",
        window_size=3,
        previous_avg=78.0,
        recent_avg=85.0,
        percentage_change=8.97,
        trend_direction=TrendDirection.IMPROVING,
        calculated_at=now,
    )
    db.add(trend)

    db.commit()
    return patient


# =============================================================================
# 1. AI Status Endpoint Tests
# =============================================================================
def test_get_ai_status(client: TestClient):
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "status" in data
    assert "model" in data
    assert "voice_model" in data
    assert "voice_enabled" in data
    assert "supported_languages" in data
    assert "en" in data["supported_languages"]
    assert "hi" in data["supported_languages"]
    assert "as" in data["supported_languages"]


def test_ai_status_when_api_key_configured():
    with patch.object(settings, "GEMINI_API_KEY", "test_gemini_api_key_123"):
        with patch("app.services.gemini_service.GENAI_AVAILABLE", True):
            status_info = GeminiService.check_availability()
            assert status_info["available"] is True
            assert status_info["status"] == "operational"
            assert status_info["voice_enabled"] is True


def test_ai_status_when_api_key_missing():
    with patch.object(settings, "GEMINI_API_KEY", None):
        status_info = GeminiService.check_availability()
        assert status_info["available"] is False
        assert status_info["status"] == "api_key_missing"
        assert status_info["voice_enabled"] is False


# =============================================================================
# 2. Voice Session & Token Endpoint Tests
# =============================================================================
def test_create_voice_session_as_caregiver(
    client: TestClient,
    seed_test_data,
    caregiver_auth_headers,
):
    patient = seed_test_data["patient"]
    payload = {
        "patient_id": patient.id,
        "preferred_language": "as",
        "voice_name": "Puck",
    }
    response = client.post(
        "/api/v1/ai/voice/session",
        json=payload,
        headers=caregiver_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["patient_id"] == patient.id
    assert data["language"] == "as"
    assert "/api/v1/ai/voice/ws/" in data["websocket_url"]
    assert "ephemeral_token" in data
    # Ensure GEMINI_API_KEY is never leaked
    assert "GEMINI_API_KEY" not in str(data)
    assert settings.GEMINI_API_KEY not in str(data) if settings.GEMINI_API_KEY else True
    assert "system_instruction" in data
    assert "MindEase" in data["system_instruction"]


def test_create_voice_session_as_patient(
    client: TestClient,
    seed_test_data,
    patient_auth_headers,
):
    patient = seed_test_data["patient"]
    payload = {
        "patient_id": patient.id,
        "preferred_language": "hi",
    }
    response = client.post(
        "/api/v1/ai/voice/session",
        json=payload,
        headers=patient_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient.id
    assert data["language"] == "hi"


def test_create_voice_session_unauthorized_caregiver(
    client: TestClient,
    seed_test_data,
    other_caregiver_auth_headers,
):
    patient = seed_test_data["patient"]
    payload = {
        "patient_id": patient.id,
    }
    response = client.post(
        "/api/v1/ai/voice/session",
        json=payload,
        headers=other_caregiver_auth_headers,
    )
    assert response.status_code == 403


def test_get_voice_token(
    client: TestClient,
    seed_test_data,
    caregiver_auth_headers,
):
    patient = seed_test_data["patient"]
    payload = {
        "session_id": "test_sess_001",
        "patient_id": patient.id,
    }
    response = client.post(
        "/api/v1/ai/voice/token",
        json=payload,
        headers=caregiver_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["token_type"] == "Bearer"
    assert data["expires_in"] == 3600


# =============================================================================
# 3. Backend Function Calling Tools Tests
# =============================================================================
def test_ai_tool_get_patient_profile(db: Session, populated_patient_db):
    patient = populated_patient_db
    profile = AIToolsService.get_patient_profile(db, patient.id)
    assert profile["patient_id"] == patient.id
    assert profile["full_name"] == "Bhaben Bora"
    assert profile["preferred_language"] == "as"
    assert profile["primary_caregiver"] == "Dr. Sunita Barua"
    assert "nature" in profile["interests"]


def test_ai_tool_get_today_activity(db: Session, populated_patient_db):
    patient = populated_patient_db
    activities = AIToolsService.get_today_activity(db, patient.id)
    assert activities["total_activities_completed_today"] >= 1
    assert len(activities["sessions_today"]) >= 1
    assert activities["sessions_today"][0]["category"] == "memory"


def test_ai_tool_get_next_recommended_game(db: Session, populated_patient_db):
    patient = populated_patient_db
    rec = AIToolsService.get_next_recommended_game(db, patient.id)
    assert "game_id" in rec
    assert "game_name" in rec
    assert "target_difficulty" in rec
    assert "reason" in rec


def test_ai_tool_get_upcoming_reminders(db: Session, populated_patient_db):
    patient = populated_patient_db
    rem = AIToolsService.get_upcoming_reminders(db, patient.id)
    assert rem["total_active_reminders"] >= 1
    assert len(rem["all_reminders"]) >= 1
    # Check that Morning Medicine is found
    med_rem = next(r for r in rem["all_reminders"] if r["title"] == "Morning Medicine")
    assert med_rem["is_completed_today"] is True


def test_ai_tool_get_medication_schedule(db: Session, populated_patient_db):
    patient = populated_patient_db
    meds = AIToolsService.get_medication_schedule(db, patient.id)
    assert meds["active_medications_count"] == 1
    assert meds["medications"][0]["name"] == "Donepezil"
    assert meds["medications"][0]["dosage"] == "5mg"


def test_ai_tool_get_next_appointment(db: Session, populated_patient_db):
    patient = populated_patient_db
    appt = AIToolsService.get_next_appointment(db, patient.id)
    assert appt["has_upcoming_appointment"] is True
    assert "Clinic Consultation" in appt["appointment_title"]


def test_ai_tool_get_recent_performance(db: Session, populated_patient_db):
    patient = populated_patient_db
    perf = AIToolsService.get_recent_performance(db, patient.id)
    assert perf["recent_sessions_count"] >= 1
    assert perf["sessions"][0]["accuracy"] == "85.0%"


def test_ai_tool_get_patient_progress(db: Session, populated_patient_db):
    patient = populated_patient_db
    prog = AIToolsService.get_patient_progress(db, patient.id)
    assert prog["total_sessions_completed"] >= 1
    assert "memory" in prog["cognitive_categories"]
    assert prog["cognitive_categories"]["memory"]["trend_direction"] == "improving"


def test_ai_tool_get_family_members(db: Session, populated_patient_db):
    patient = populated_patient_db
    fam = AIToolsService.get_family_members(db, patient.id)
    assert fam["family_members_count"] == 1
    assert fam["family_members"][0]["name"] == "Anupam Bora"
    assert fam["family_members"][0]["relation"] == "Son"
    assert fam["family_members"][0]["is_emergency_contact"] is True


def test_ai_tool_dispatcher(db: Session, populated_patient_db):
    patient = populated_patient_db
    res = AIToolsService.execute_tool("get_patient_profile", {}, db, patient.id)
    assert res["full_name"] == "Bhaben Bora"

    res_err = AIToolsService.execute_tool("unknown_tool", {}, db, patient.id)
    assert "error" in res_err


# =============================================================================
# 4. Fallback Chat & Intent Recognition Tests
# =============================================================================
def test_chat_medication_query(
    client: TestClient,
    populated_patient_db,
    patient_auth_headers,
):
    patient = populated_patient_db
    payload = {
        "patient_id": patient.id,
        "message": "When is my next medicine?",
        "language": "en",
    }
    response = client.post(
        "/api/v1/ai/chat",
        json=payload,
        headers=patient_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "Donepezil" in data["reply"]
    assert "get_medication_schedule" in data["tool_calls_executed"]


def test_chat_activity_query(
    client: TestClient,
    populated_patient_db,
    patient_auth_headers,
):
    patient = populated_patient_db
    payload = {
        "patient_id": patient.id,
        "message": "What game should I play now?",
        "language": "en",
    }
    response = client.post(
        "/api/v1/ai/chat",
        json=payload,
        headers=patient_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "get_next_recommended_game" in data["tool_calls_executed"]


def test_chat_multilingual_hindi_assamese(
    client: TestClient,
    populated_patient_db,
    patient_auth_headers,
):
    patient = populated_patient_db
    
    # Hindi query
    res_hi = client.post(
        "/api/v1/ai/chat",
        json={"patient_id": patient.id, "message": "Meri dawai kab leni hai?", "language": "hi"},
        headers=patient_auth_headers,
    )
    assert res_hi.status_code == 200
    assert "दवाइयों" in res_hi.json()["reply"]

    # Assamese query
    res_as = client.post(
        "/api/v1/ai/chat",
        json={"patient_id": patient.id, "message": "মই এতিয়া কি খেল খেলিম?", "language": "as"},
        headers=patient_auth_headers,
    )
    assert res_as.status_code == 200
    assert "কাৰ্যকলাপ" in res_as.json()["reply"] or "খেল" in res_as.json()["reply"] or "স্তৰ" in res_as.json()["reply"]


# =============================================================================
# 5. Caregiver AI Insights Tests
# =============================================================================
def test_generate_caregiver_insights_endpoint(
    client: TestClient,
    populated_patient_db,
    caregiver_auth_headers,
):
    patient = populated_patient_db
    response = client.post(
        f"/api/v1/ai/insights/{patient.id}",
        json={"force_refresh": True, "timeframe": "week"},
        headers=caregiver_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient.id
    assert "summary" in data
    assert isinstance(data["positive_observations"], list)
    assert isinstance(data["areas_to_watch"], list)
    assert isinstance(data["activity_observations"], list)
    assert isinstance(data["suggested_actions"], list)
    assert data["confidence"] in ["high", "moderate", "low"]
    assert "model" in data


def test_get_latest_caregiver_insights_endpoint(
    client: TestClient,
    populated_patient_db,
    caregiver_auth_headers,
):
    patient = populated_patient_db
    # First generate
    client.post(
        f"/api/v1/ai/insights/{patient.id}",
        json={"force_refresh": True},
        headers=caregiver_auth_headers,
    )

    # Then retrieve latest
    response = client.get(
        f"/api/v1/ai/insights/{patient.id}",
        headers=caregiver_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient.id
    assert len(data["summary"]) > 0


def test_non_diagnostic_guardrails_in_insights(
    client: TestClient,
    populated_patient_db,
    caregiver_auth_headers,
):
    patient = populated_patient_db
    response = client.post(
        f"/api/v1/ai/insights/{patient.id}",
        json={"force_refresh": True},
        headers=caregiver_auth_headers,
    )
    data = response.json()
    full_text = str(data).lower()

    # Verify absence of forbidden diagnostic statements
    forbidden_terms = [
        "dementia is worsening",
        "dementia is getting worse",
        "dementia is improving",
        "you have cognitive decline",
        "you have dementia",
        "increase medication",
        "decrease medication",
    ]
    for term in forbidden_terms:
        assert term not in full_text, f"Forbidden diagnostic term '{term}' found in output!"


def test_mock_gemini_structured_generation(db: Session, populated_patient_db):
    patient = populated_patient_db
    mock_gemini_response = {
        "summary": "The patient demonstrated steady cognitive activity participation this week with high accuracy.",
        "positive_observations": ["Memory activity scores were 8% higher than recent baseline."],
        "areas_to_watch": ["Occasional hesitation noted during attention tasks."],
        "activity_observations": ["Completed 3 memory exercises with consistent accuracy."],
        "suggested_actions": ["Maintain daily morning 5-minute activity routine."],
        "confidence": "high",
    }

    with patch.object(GeminiService, "generate_structured_json", return_value=mock_gemini_response):
        insight = AIInsightsService.generate_patient_insights(
            db=db,
            patient_id=patient.id,
            force_refresh=True,
        )
        assert insight.confidence == "high"
        assert "steady cognitive activity participation" in insight.summary
        assert len(insight.positive_observations) == 1
        assert "Memory activity scores" in insight.positive_observations[0]
