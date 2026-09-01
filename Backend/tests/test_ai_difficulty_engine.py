from app.ai.difficulty_engine import DifficultyEngine
from app.utils.enums import DifficultyAction


def test_difficulty_maintain_when_few_sessions():
    # Only 1 session
    metrics = [{"accuracy": 95.0, "error_rate": 5.0, "hint_rate": 0.0, "completion_rate": 100.0}]
    rec = DifficultyEngine.evaluate_difficulty(current_difficulty=2, recent_session_metrics=metrics)

    assert rec["recommended_difficulty"] == 2
    assert rec["action"] == DifficultyAction.MAINTAIN


def test_difficulty_increase_on_consistently_high_performance():
    # 3 consecutive strong sessions >= 85% accuracy
    metrics = [
        {"accuracy": 90.0, "error_rate": 10.0, "hint_rate": 0.0, "completion_rate": 100.0},
        {"accuracy": 88.0, "error_rate": 12.0, "hint_rate": 0.0, "completion_rate": 100.0},
        {"accuracy": 92.0, "error_rate": 8.0, "hint_rate": 0.0, "completion_rate": 100.0},
    ]
    rec = DifficultyEngine.evaluate_difficulty(
        current_difficulty=2,
        recent_session_metrics=metrics,
        min_difficulty=1,
        max_difficulty=5,
    )

    assert rec["recommended_difficulty"] == 3
    assert rec["action"] == DifficultyAction.INCREASE
    assert "consistently strong" in rec["reason"].lower()


def test_difficulty_clamping_at_max():
    # Already at max_difficulty 5 with strong scores
    metrics = [
        {"accuracy": 95.0, "error_rate": 5.0, "hint_rate": 0.0, "completion_rate": 100.0},
        {"accuracy": 95.0, "error_rate": 5.0, "hint_rate": 0.0, "completion_rate": 100.0},
        {"accuracy": 95.0, "error_rate": 5.0, "hint_rate": 0.0, "completion_rate": 100.0},
    ]
    rec = DifficultyEngine.evaluate_difficulty(
        current_difficulty=5,
        recent_session_metrics=metrics,
        min_difficulty=1,
        max_difficulty=5,
    )

    assert rec["recommended_difficulty"] == 5
    assert rec["action"] == DifficultyAction.MAINTAIN


def test_difficulty_decrease_on_struggling_performance():
    # Low accuracy < 60%
    metrics = [
        {"accuracy": 50.0, "error_rate": 50.0, "hint_rate": 30.0, "completion_rate": 100.0},
        {"accuracy": 55.0, "error_rate": 45.0, "hint_rate": 20.0, "completion_rate": 100.0},
        {"accuracy": 48.0, "error_rate": 52.0, "hint_rate": 25.0, "completion_rate": 100.0},
    ]
    rec = DifficultyEngine.evaluate_difficulty(
        current_difficulty=3,
        recent_session_metrics=metrics,
        min_difficulty=1,
        max_difficulty=5,
    )

    assert rec["recommended_difficulty"] == 2
    assert rec["action"] == DifficultyAction.DECREASE
    assert "supportive" in rec["reason"].lower() or "comfortable" in rec["reason"].lower()
