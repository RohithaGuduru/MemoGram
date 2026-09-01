from app.ai.trend import TrendEngine
from app.utils.enums import TrendDirection


def test_trend_insufficient_data():
    # Only 2 sessions
    trend = TrendEngine.calculate_trend([70.0, 75.0], metric_name="accuracy")
    assert trend["trend_direction"] == TrendDirection.INSUFFICIENT_DATA


def test_trend_improving_accuracy():
    # Previous 3 sessions: 65, 68, 70 (avg: 67.67)
    # Recent 3 sessions: 76, 80, 84 (avg: 80.0)
    sessions = [65.0, 68.0, 70.0, 76.0, 80.0, 84.0]
    trend = TrendEngine.calculate_trend(sessions, metric_name="accuracy")

    assert trend["trend_direction"] == TrendDirection.IMPROVING
    assert trend["percentage_change"] > 0


def test_trend_declining_accuracy():
    # Previous 3: 85, 85, 90 (avg: 86.67)
    # Recent 3: 65, 60, 60 (avg: 61.67)
    sessions = [85.0, 85.0, 90.0, 65.0, 60.0, 60.0]
    trend = TrendEngine.calculate_trend(sessions, metric_name="accuracy")

    assert trend["trend_direction"] == TrendDirection.DECLINING
    assert trend["percentage_change"] < 0


def test_trend_stable():
    # Small fluctuations under 4% threshold
    sessions = [75.0, 76.0, 75.0, 76.0, 75.0, 76.0]
    trend = TrendEngine.calculate_trend(sessions, metric_name="accuracy")

    assert trend["trend_direction"] == TrendDirection.STABLE
