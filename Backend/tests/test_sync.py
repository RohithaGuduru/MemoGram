from fastapi import status


def test_offline_sync_push_and_pull(client, patient_auth_headers, seed_test_data):
    patient_id = seed_test_data["patient"].id
    game_id = seed_test_data["game"].id

    # 1. Batch Push from offline Flutter SQLite client
    push_payload = {
        "device_id": "tab-samsung-ne-001",
        "patient_id": patient_id,
        "platform": "android",
        "app_version": "1.0.0",
        "operations": [
            {
                "operation_id": "offline-op-001",
                "entity_type": "GAME_SESSION",
                "entity_id": "offline-sess-001",
                "operation": "CREATE",
                "timestamp": "2026-08-29T10:00:00Z",
                "data": {
                    "game_id": game_id,
                    "difficulty": 1,
                    "device_id": "tab-samsung-ne-001",
                },
            },
            {
                "operation_id": "offline-op-002",
                "entity_type": "GAME_RESULT",
                "entity_id": "offline-sess-001",
                "operation": "CREATE",
                "timestamp": "2026-08-29T10:01:00Z",
                "data": {
                    "session_id": "offline-sess-001",
                    "total_questions": 10,
                    "correct_answers": 8,
                    "incorrect_answers": 2,
                    "total_time_ms": 30000,
                    "response_times": [3000] * 10,
                },
            },
        ],
    }

    push_res = client.post("/api/v1/sync/push", headers=patient_auth_headers, json=push_payload)
    assert push_res.status_code == status.HTTP_200_OK
    push_data = push_res.json()
    assert push_data["processed_count"] == 2
    assert "offline-op-001" in push_data["successful_op_ids"]
    assert "offline-op-002" in push_data["successful_op_ids"]

    # 2. Idempotent Retry: Re-push the exact same batch
    retry_res = client.post("/api/v1/sync/push", headers=patient_auth_headers, json=push_payload)
    assert retry_res.status_code == status.HTTP_200_OK
    retry_data = retry_res.json()
    assert retry_data["processed_count"] == 2
    assert len(retry_data["failed_ops"]) == 0

    # 3. Pull Delta Sync
    pull_payload = {
        "patient_id": patient_id,
        "device_id": "tab-samsung-ne-001",
    }
    pull_res = client.post("/api/v1/sync/pull", headers=patient_auth_headers, json=pull_payload)
    assert pull_res.status_code == status.HTTP_200_OK
    pull_data = pull_res.json()
    assert "games" in pull_data
    assert "daily_activities" in pull_data
    assert "cultural_assets" in pull_data
