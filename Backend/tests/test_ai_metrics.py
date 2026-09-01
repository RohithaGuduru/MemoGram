from app.ai.metrics import PerformanceMetricsCalculator


def test_metrics_calculation_standard():
    preprocessed_data = {
        "total_questions": 10,
        "correct_answers": 8,
        "incorrect_answers": 2,
        "hints_used": 2,
        "attempts_count": 10,
        "total_time_ms": 50000,
        "response_times": [4000, 5000, 6000, 5000, 5000, 4000, 6000, 5000, 5000, 5000],
    }
    metrics = PerformanceMetricsCalculator.calculate_session_metrics(preprocessed_data)

    assert metrics["accuracy"] == 80.0
    assert metrics["error_rate"] == 20.0
    assert metrics["average_response_time_ms"] == 5000.0
    assert metrics["median_response_time_ms"] == 5000.0
    assert metrics["hint_rate"] == 20.0
    assert metrics["completion_rate"] == 100.0


def test_metrics_calculation_perfect_score():
    preprocessed_data = {
        "total_questions": 5,
        "correct_answers": 5,
        "incorrect_answers": 0,
        "hints_used": 0,
        "attempts_count": 5,
        "total_time_ms": 15000,
        "response_times": [3000, 3000, 3000, 3000, 3000],
    }
    metrics = PerformanceMetricsCalculator.calculate_session_metrics(preprocessed_data)

    assert metrics["accuracy"] == 100.0
    assert metrics["error_rate"] == 0.0
    assert metrics["hint_rate"] == 0.0
    assert metrics["average_response_time_ms"] == 3000.0
