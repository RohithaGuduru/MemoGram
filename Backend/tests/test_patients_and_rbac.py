from fastapi import status


def test_caregiver_create_patient(client, caregiver_auth_headers):
    res = client.post(
        "/api/v1/patients",
        headers=caregiver_auth_headers,
        json={
            "full_name": "Minoti Goswami",
            "email": "minoti.g@example.com",
            "date_of_birth": "1952-08-14",
            "preferred_language": "as",
            "font_size": "large",
            "interests": ["nature", "tea_gardens"],
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["full_name"] == "Minoti Goswami"
    assert data["preferred_language"] == "as"


def test_caregiver_list_assigned_patients(client, caregiver_auth_headers, seed_test_data):
    res = client.get("/api/v1/patients", headers=caregiver_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) >= 1
    assert any(p["id"] == seed_test_data["patient"].id for p in data)


def test_rbac_patient_cannot_access_other_patient(client, patient_auth_headers):
    # Patient trying to access non-existent or other patient
    res = client.get(
        "/api/v1/patients/random-uuid-9999-9999",
        headers=patient_auth_headers,
    )
    assert res.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]


def test_rbac_unassigned_caregiver_forbidden(
    client,
    other_caregiver_auth_headers,
    seed_test_data,
):
    patient_id = seed_test_data["patient"].id
    # Other caregiver is NOT assigned to this patient
    res = client.get(f"/api/v1/patients/{patient_id}", headers=other_caregiver_auth_headers)
    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert "not assigned" in res.json()["detail"].lower()


def test_patient_can_view_own_profile(client, patient_auth_headers, seed_test_data):
    patient_id = seed_test_data["patient"].id
    res = client.get(f"/api/v1/patients/{patient_id}", headers=patient_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["id"] == patient_id
