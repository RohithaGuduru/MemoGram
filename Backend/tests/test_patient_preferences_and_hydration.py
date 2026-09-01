import pytest
from datetime import datetime, timezone, timedelta
from app.models.patient import Patient
from app.utils.enums import RelationshipStatus, ReminderType


def test_patient_first_time_preference_update(client, seed_test_data, patient_auth_headers, db):
    """Verify updating language and font size on patient profile."""
    patient = seed_test_data["patient"]

    # Update preferred language and font size
    update_payload = {
        "preferred_language": "hi",
        "font_size": "large",
        "accessibility_preferences": {
            "preferences_configured": True,
            "high_contrast": True
        }
    }
    res = client.put(f"/api/v1/patients/{patient.id}", json=update_payload, headers=patient_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["preferred_language"] == "hi"
    assert data["font_size"] == "large"
    assert data["accessibility_preferences"]["preferences_configured"] is True

    # Verify persisted in database
    db.refresh(patient)
    assert patient.primary_language == "hi"
    assert patient.preferred_language == "hi"
    assert patient.font_size == "large"


def test_hydration_reminder_lifecycle(client, seed_test_data, caregiver_auth_headers, patient_auth_headers, db):
    """Verify creating a hydration reminder as caregiver and completing/acknowledging it as patient."""
    patient = seed_test_data["patient"]

    # Caregiver creates an hourly hydration reminder
    create_payload = {
        "title": "💧 Drink Water",
        "description": "Hourly hydration reminder to stay healthy.",
        "reminder_type": "HYDRATION",
        "scheduled_time": "15:00:00",
        "recurrence_rule": "HOURLY",
        "is_active": True,
    }
    res = client.post(f"/api/v1/patients/{patient.id}/reminders", json=create_payload, headers=caregiver_auth_headers)
    assert res.status_code == 201, res.text
    reminder_data = res.json()
    assert reminder_data["reminder_type"] == "HYDRATION"
    assert reminder_data["title"] == "💧 Drink Water"
    assert reminder_data["recurrence_rule"] == "HOURLY"
    reminder_id = reminder_data["id"]

    # Patient lists reminders -> Exactly 1 active hydration reminder (no duplicates)
    list_res = client.get(f"/api/v1/patients/{patient.id}/reminders", headers=patient_auth_headers)
    assert list_res.status_code == 200
    reminders = list_res.json()
    hydration_reminders = [r for r in reminders if r["reminder_type"] == "HYDRATION"]
    assert len(hydration_reminders) == 1
    assert hydration_reminders[0]["id"] == reminder_id

    # Patient acknowledges/completes hydration reminder ("✓ I Drank Water")
    complete_payload = {
        "status": "COMPLETED",
    }
    comp_res = client.post(f"/api/v1/reminders/{reminder_id}/complete", json=complete_payload, headers=patient_auth_headers)
    assert comp_res.status_code == 200, comp_res.text
    log_data = comp_res.json()
    assert log_data["status"] == "COMPLETED"
    assert log_data["reminder_id"] == reminder_id

    # Re-checking reminders -> Still exactly 1 active reminder object, no duplicate entries created
    list_res2 = client.get(f"/api/v1/patients/{patient.id}/reminders", headers=patient_auth_headers)
    assert list_res2.status_code == 200
    reminders2 = list_res2.json()
    hydration_reminders2 = [r for r in reminders2 if r["reminder_type"] == "HYDRATION"]
    assert len(hydration_reminders2) == 1


def test_voice_process_with_regional_languages(client, seed_test_data, patient_auth_headers, db):
    """Verify voice gateway returns regional response and structured IN_DEVELOPMENT for unsupported TTS."""
    patient = seed_test_data["patient"]
    patient.primary_language = "mizo"
    db.commit()

    payload = {
        "patient_id": patient.id,
        "language": "mizo",
        "transcript_text": "Hello Memogram",
    }
    res = client.post("/api/v1/voice/process", json=payload, headers=patient_auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "Memogram" in data["reply_text"]
    # Mizo TTS is in development -> Structured fallback
    assert data["tts_available"] is False
    assert data["tts_status"] == "IN_DEVELOPMENT"
    assert "Mizo" in data["tts_message"]
