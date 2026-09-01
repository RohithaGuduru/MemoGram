from fastapi import status


def test_medication_crud_lifecycle(client, caregiver_auth_headers, seed_test_data):
    patient_id = seed_test_data["patient"].id

    # Create medication
    create_res = client.post(
        f"/api/v1/patients/{patient_id}/medications",
        headers=caregiver_auth_headers,
        json={
            "name": "Telmisartan",
            "dosage": "40mg",
            "time_of_day": "09:00 AM",
            "frequency": "daily",
            "start_date": "2026-01-01",
            "instructions": "Take after breakfast with water",
        },
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    med_id = create_res.json()["id"]

    # List medications
    list_res = client.get(f"/api/v1/patients/{patient_id}/medications", headers=caregiver_auth_headers)
    assert list_res.status_code == status.HTTP_200_OK
    assert len(list_res.json()) >= 1

    # Update medication
    update_res = client.put(
        f"/api/v1/medications/{med_id}",
        headers=caregiver_auth_headers,
        json={"dosage": "80mg"},
    )
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["dosage"] == "80mg"

    # Delete medication
    del_res = client.delete(f"/api/v1/medications/{med_id}", headers=caregiver_auth_headers)
    assert del_res.status_code == status.HTTP_204_NO_CONTENT


def test_reminder_creation_and_completion(client, caregiver_auth_headers, patient_auth_headers, seed_test_data):
    patient_id = seed_test_data["patient"].id

    # Create Reminder
    create_res = client.post(
        f"/api/v1/patients/{patient_id}/reminders",
        headers=caregiver_auth_headers,
        json={
            "title": "Evening Warm Herbal Tea",
            "reminder_type": "HYDRATION",
            "scheduled_time": "17:00:00",
            "recurrence_rule": "DAILY",
        },
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    rem_id = create_res.json()["id"]

    # Complete Reminder by Patient
    comp_res = client.post(
        f"/api/v1/reminders/{rem_id}/complete",
        headers=patient_auth_headers,
        json={
            "status": "COMPLETED",
        },
    )
    assert comp_res.status_code == status.HTTP_200_OK
    data = comp_res.json()
    assert data["reminder_id"] == rem_id
    assert data["status"] == "COMPLETED"
