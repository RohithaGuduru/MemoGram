from fastapi import status


def test_performance_overview_and_recommendation(client, caregiver_auth_headers, seed_test_data):
    patient_id = seed_test_data["patient"].id

    # Performance overview
    res = client.get(f"/api/v1/patients/{patient_id}/performance/overview", headers=caregiver_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["patient_id"] == patient_id
    assert "current_difficulty_levels" in data

    # Next recommendation
    rec_res = client.get(f"/api/v1/patients/{patient_id}/recommendations/next", headers=caregiver_auth_headers)
    assert rec_res.status_code == status.HTTP_200_OK
    rec_data = rec_res.json()
    assert "recommended_game_id" in rec_data
    assert "reason" in rec_data


def test_weekly_report_and_non_diagnostic_insights(client, caregiver_auth_headers, seed_test_data):
    patient_id = seed_test_data["patient"].id

    res = client.get(f"/api/v1/patients/{patient_id}/reports/weekly", headers=caregiver_auth_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["patient_id"] == patient_id
    assert "insights" in data

    # Ensure insights strictly avoid medical / dementia diagnoses
    for insight in data["insights"]:
        msg = insight["message"].lower()
        assert "dementia" not in msg
        assert "alzheimer" not in msg
        assert "diagnos" not in msg


def test_alert_lifecycle(client, caregiver_auth_headers, seed_test_data, db):
    from app.services.alert_service import AlertService
    from app.utils.enums import AlertSeverity

    patient_id = seed_test_data["patient"].id
    # Create an alert via service
    alert = AlertService.create_alert(
        db=db,
        patient_id=patient_id,
        alert_type="ENGAGEMENT_DROP",
        severity=AlertSeverity.INFO,
        title="Activity Check",
        message="Patient has completed fewer activities this week.",
    )

    # List alerts
    list_res = client.get(f"/api/v1/patients/{patient_id}/alerts", headers=caregiver_auth_headers)
    assert list_res.status_code == status.HTTP_200_OK
    assert len(list_res.json()) >= 1

    # Mark read
    read_res = client.patch(f"/api/v1/alerts/{alert.id}/read", headers=caregiver_auth_headers)
    assert read_res.status_code == status.HTTP_200_OK
    assert read_res.json()["is_read"] is True

    # Mark resolved
    res_res = client.patch(f"/api/v1/alerts/{alert.id}/resolve", headers=caregiver_auth_headers)
    assert res_res.status_code == status.HTTP_200_OK
    assert res_res.json()["is_resolved"] is True
