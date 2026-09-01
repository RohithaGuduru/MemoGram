from app.ai.preprocessing import GameDataPreprocessor


def test_preprocessing_valid_data():
    raw_payload = {
        "total_questions": 10,
        "correct_answers": 8,
        "incorrect_answers": 2,
        "errors_count": 2,
        "attempts_count": 10,
        "hints_used": 1,
        "total_time_ms": 40000,
        "response_times": [4000, 3800, 4200, 3900, 4100, 4300, 3700, 4000, 4100, 3900],
    }
    result = GameDataPreprocessor.sanitize_raw_result(raw_payload)

    assert result["total_questions"] == 10
    assert result["correct_answers"] == 8
    assert result["incorrect_answers"] == 2
    assert result["hints_used"] == 1
    assert len(result["response_times"]) == 10


def test_preprocessing_filters_anomalous_response_times():
    raw_payload = {
        "total_questions": 5,
        "correct_answers": 5,
        "total_time_ms": 15000,
        # 20ms is an accidental tap (< 100ms), 200000ms is an abandoned/interrupted session (> 180s)
        "response_times": [20, 3000, 3500, 4000, 200000],
    }
    result = GameDataPreprocessor.sanitize_raw_result(raw_payload)

    # 20ms and 200000ms should be removed, leaving 3 valid response times
    assert len(result["response_times"]) == 3
    assert 20 not in result["response_times"]
    assert 200000 not in result["response_times"]


def test_preprocessing_clamps_incorrect_answers():
    raw_payload = {
        "total_questions": 5,
        "correct_answers": 4,
        "incorrect_answers": 10,  # Invalid: correct (4) + incorrect (10) > total (5)
    }
    result = GameDataPreprocessor.sanitize_raw_result(raw_payload)

    assert result["correct_answers"] == 4
    assert result["incorrect_answers"] == 1  # Clamped to 5 - 4 = 1
