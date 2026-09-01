from fastapi import status


def test_game_catalog_and_session_lifecycle(client, patient_auth_headers, seed_test_data):
    game_id = seed_test_data["game"].id
    patient_id = seed_test_data["patient"].id

    # 1. List active games
    games_res = client.get("/api/v1/games", headers=patient_auth_headers)
    assert games_res.status_code == status.HTTP_200_OK
    assert len(games_res.json()) >= 1

    # 2. Start game session
    start_res = client.post(
        f"/api/v1/games/{game_id}/sessions",
        headers=patient_auth_headers,
        json={
            "client_session_id": "test-sess-uuid-001",
            "patient_id": patient_id,
            "difficulty": 1,
            "device_id": "tab-01",
        },
    )
    assert start_res.status_code == status.HTTP_201_CREATED
    sess_id = start_res.json()["id"]

    # 3. Submit game session result
    result_payload = {
        "total_questions": 10,
        "correct_answers": 9,
        "incorrect_answers": 1,
        "errors_count": 1,
        "attempts_count": 10,
        "hints_used": 0,
        "total_time_ms": 35000,
        "response_times": [3500] * 10,
    }
    submit_res = client.post(
        f"/api/v1/games/sessions/{sess_id}/result",
        headers=patient_auth_headers,
        json=result_payload,
    )
    assert submit_res.status_code == status.HTTP_200_OK
    res_data = submit_res.json()
    assert res_data["metrics"]["accuracy"] == 90.0
    assert res_data["metrics"]["error_rate"] == 10.0

    # 4. IDEMPOTENCY TEST: Submit the exact same session result again
    re_submit_res = client.post(
        f"/api/v1/games/sessions/{sess_id}/result",
        headers=patient_auth_headers,
        json=result_payload,
    )
    assert re_submit_res.status_code == status.HTTP_200_OK
    re_data = re_submit_res.json()
    assert re_data["result_id"] == res_data["result_id"]
    assert re_data["metrics"]["accuracy"] == 90.0
