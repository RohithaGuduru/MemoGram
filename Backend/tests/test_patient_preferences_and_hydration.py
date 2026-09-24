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
    # Mizo TTS when unconfigured -> Structured fallback
    assert data["tts_available"] is False
    assert data["tts_status"] in ["UNAVAILABLE", "IN_DEVELOPMENT"]
    assert "Mizo" in data["tts_message"]


def test_patient_setup_comprehensive_flow(client, seed_test_data, caregiver_auth_headers, db):
    """
    Comprehensive validation of the Patient Setup sections:
    1. Patient profile & preferences
    2. Multiple medicines with dosage, frequency, times, and instructions
    3. Hydration settings & reminder
    4. Multiple family members with relationships and phone numbers
    5. Appointment setup with hospital, doctor, date, and time
    6. Reload patient and verify all persisted data
    """
    patient = seed_test_data["patient"]

    # 1. Update patient accessibility preferences with hydration
    patient_res = client.put(
        f"/api/v1/patients/{patient.id}",
        json={
            "preferred_language": "en",
            "font_size": "large",
            "accessibility_preferences": {
                "hydration": {
                    "dailyGoalGlasses": 8,
                    "unit": "glasses",
                    "startTime": "08:00 AM",
                    "endTime": "08:00 PM",
                    "reminderIntervalMinutes": 60,
                    "enabled": True
                }
            }
        },
        headers=caregiver_auth_headers
    )
    assert patient_res.status_code == 200

    # 2. Add multiple medications with dosage, frequency, time, instructions
    med1_res = client.post(
        f"/api/v1/medicines/patient/{patient.id}",
        json={
            "name": "Donepezil",
            "dosage": "5mg (1 tablet)",
            "time_of_day": "08:00 AM",
            "frequency": "Once",
            "instructions": "Take right after breakfast with water",
            "remaining_quantity": 30,
            "total_quantity": 30,
        },
        headers=caregiver_auth_headers
    )
    assert med1_res.status_code == 201
    med1_id = med1_res.json()["id"]

    med2_res = client.post(
        f"/api/v1/medicines/patient/{patient.id}",
        json={
            "name": "Memantine",
            "dosage": "10mg (1 tablet)",
            "time_of_day": "08:00 PM",
            "frequency": "Twice",
            "instructions": "Take after dinner with milk",
            "remaining_quantity": 60,
            "total_quantity": 60,
        },
        headers=caregiver_auth_headers
    )
    assert med2_res.status_code == 201
    med2_id = med2_res.json()["id"]

    # 3. Add Hydration reminder
    hyd_res = client.post(
        f"/api/v1/patients/{patient.id}/reminders",
        json={
            "title": "Daily Hydration Reminder (8 glasses/day)",
            "description": "Hydration goal: 8 glasses between 08:00 AM and 08:00 PM every 60 mins",
            "reminder_type": "HYDRATION",
            "scheduled_time": "08:00:00",
            "recurrence_rule": "INTERVAL_MINUTES=60;START=08:00 AM;END=08:00 PM;GOAL=8",
            "is_active": True,
        },
        headers=caregiver_auth_headers
    )
    assert hyd_res.status_code == 201
    hyd_id = hyd_res.json()["id"]

    # 4. Add multiple family members with relation and phone
    fam1_res = client.post(
        f"/api/v1/patients/{patient.id}/family",
        json={
            "name": "Sunita Sharma",
            "relation": "Spouse",
            "phone": "+91 98765 22334",
            "notes": "Lives together, helps with morning walk",
            "is_emergency_contact": True
        },
        headers=caregiver_auth_headers
    )
    assert fam1_res.status_code == 201
    fam1_id = fam1_res.json()["id"]

    fam2_res = client.post(
        f"/api/v1/patients/{patient.id}/family",
        json={
            "name": "Rohan Sharma",
            "relation": "Grandson",
            "phone": "+91 98765 55667",
            "notes": "Visits every Sunday",
            "is_emergency_contact": False
        },
        headers=caregiver_auth_headers
    )
    assert fam2_res.status_code == 201
    fam2_id = fam2_res.json()["id"]

    # 5. Add Appointment reminder with hospital, doctor, date, and time
    apt_res = client.post(
        f"/api/v1/patients/{patient.id}/reminders",
        json={
            "title": "Appointment with Dr. Ramesh Sharma at Apollo Hospital",
            "description": "Hospital: Apollo Hospital, Doctor: Dr. Ramesh Sharma, Notes: Quarterly neurological review",
            "reminder_type": "APPOINTMENT",
            "scheduled_time": "10:30:00",
            "recurrence_rule": "ONCE;DATE=2026-09-25",
            "is_active": True,
        },
        headers=caregiver_auth_headers
    )
    assert apt_res.status_code == 201
    apt_id = apt_res.json()["id"]

    # 6. Reload patient and verify all saved information appears
    # 6a. Patient profile and hydration settings
    reload_patient = client.get(f"/api/v1/patients/{patient.id}", headers=caregiver_auth_headers)
    assert reload_patient.status_code == 200
    p_data = reload_patient.json()
    assert p_data["accessibility_preferences"]["hydration"]["dailyGoalGlasses"] == 8
    assert p_data["accessibility_preferences"]["hydration"]["reminderIntervalMinutes"] == 60

    # 6b. Medicines reload
    reload_meds = client.get(f"/api/v1/medicines/patient/{patient.id}", headers=caregiver_auth_headers)
    assert reload_meds.status_code == 200
    meds_list = reload_meds.json()
    med_names = [m["name"] for m in meds_list]
    assert "Donepezil" in med_names
    assert "Memantine" in med_names

    # 6c. Family reload
    reload_fam = client.get(f"/api/v1/patients/{patient.id}/family", headers=caregiver_auth_headers)
    assert reload_fam.status_code == 200
    fam_list = reload_fam.json()
    fam_names = [f["name"] for f in fam_list]
    assert "Sunita Sharma" in fam_names
    assert "Rohan Sharma" in fam_names

    # 6d. Reminders reload (Hydration & Appointment)
    reload_rems = client.get(f"/api/v1/patients/{patient.id}/reminders", headers=caregiver_auth_headers)
    assert reload_rems.status_code == 200
    rems_list = reload_rems.json()
    types = [r["reminder_type"] for r in rems_list]
    assert "HYDRATION" in types
    assert "APPOINTMENT" in types
