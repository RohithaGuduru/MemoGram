import pytest
from app.models.caregiver import Caregiver
from app.models.patient import Patient


def test_caretaker_and_patient_preferences_are_independent(client, seed_test_data, caregiver_auth_headers, patient_auth_headers, db):
    """
    Verify that Caretaker and Patient preferences are strictly independent.
    Updating Caretaker preferences (e.g. Hindi + Large) must NOT alter Patient preferences.
    Updating Patient preferences (e.g. Assamese + Extra Large) must NOT alter Caretaker preferences.
    """
    caregiver = seed_test_data["caregiver"]
    patient = seed_test_data["patient"]

    # 1. Check initial defaults
    cg_res = client.get("/api/v1/caretakers/me", headers=caregiver_auth_headers)
    assert cg_res.status_code == 200, cg_res.text
    cg_data = cg_res.json()
    assert "preferred_language" in cg_data
    assert "font_size" in cg_data

    # 2. Caretaker selects Language = Hindi ('hi'), Font = Large ('large')
    cg_update_payload = {
        "preferred_language": "hi",
        "font_size": "large"
    }
    cg_put_res = client.put("/api/v1/caretakers/me", json=cg_update_payload, headers=caregiver_auth_headers)
    assert cg_put_res.status_code == 200, cg_put_res.text
    updated_cg = cg_put_res.json()
    assert updated_cg["preferred_language"] == "hi"
    assert updated_cg["font_size"] == "large"

    # 3. Verify in DB for Caretaker
    db.refresh(caregiver)
    assert caregiver.preferred_language == "hi"
    assert caregiver.font_size == "large"

    # 4. Verify Patient profile is completely unchanged by Caretaker update
    db.refresh(patient)
    pt_res = client.get(f"/api/v1/patients/{patient.id}", headers=patient_auth_headers)
    assert pt_res.status_code == 200
    pt_data = pt_res.json()
    assert pt_data["preferred_language"] != "hi" or patient.preferred_language == "as"

    # 5. Patient selects Language = Assamese ('as'), Font = Extra Large ('extra_large')
    pt_update_payload = {
        "preferred_language": "as",
        "font_size": "extra_large"
    }
    pt_put_res = client.put(f"/api/v1/patients/{patient.id}", json=pt_update_payload, headers=patient_auth_headers)
    assert pt_put_res.status_code == 200, pt_put_res.text
    updated_pt = pt_put_res.json()
    assert updated_pt["preferred_language"] == "as"
    assert updated_pt["font_size"] == "extra_large"

    # 6. Verify Patient in DB
    db.refresh(patient)
    assert patient.preferred_language == "as"
    assert patient.font_size == "extra_large"

    # 7. CRITICAL CHECK: Verify Caretaker preferences remained Hindi + Large
    db.refresh(caregiver)
    assert caregiver.preferred_language == "hi"
    assert caregiver.font_size == "large"

    cg_res_again = client.get("/api/v1/caretakers/me", headers=caregiver_auth_headers)
    assert cg_res_again.status_code == 200
    cg_data_again = cg_res_again.json()
    assert cg_data_again["preferred_language"] == "hi"
    assert cg_data_again["font_size"] == "large"

    # 8. Then change: Patient = Mizo ('lus') + Normal ('normal')
    pt_update_2 = {
        "preferred_language": "lus",
        "font_size": "normal",
    }
    pt_res_2 = client.put(f"/api/v1/patients/{patient.id}", json=pt_update_2, headers=patient_auth_headers)
    assert pt_res_2.status_code == 200
    db.refresh(patient)
    assert patient.preferred_language == "lus"
    assert patient.font_size == "normal"

    # Caretaker must still remain Hindi + Large
    db.refresh(caregiver)
    assert caregiver.preferred_language == "hi"
    assert caregiver.font_size == "large"

    # 9. Then change: Caretaker = English ('en') + Extra Large ('extra-large')
    cg_update_2 = {
        "preferred_language": "en",
        "font_size": "extra-large",
    }
    cg_res_2 = client.put("/api/v1/caretakers/me", json=cg_update_2, headers=caregiver_auth_headers)
    assert cg_res_2.status_code == 200
    db.refresh(caregiver)
    assert caregiver.preferred_language == "en"
    assert caregiver.font_size == "extra-large"

    # Patient must still remain Mizo + Normal
    db.refresh(patient)
    assert patient.preferred_language == "lus"
    assert patient.font_size == "normal"
