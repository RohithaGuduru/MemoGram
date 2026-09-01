from app.ai.baseline import BaselineEngine


def test_baseline_not_created_with_insufficient_samples():
    # 4 samples is under the 5-sample threshold
    samples = [
        {"accuracy": 70.0, "average_response_time_ms": 5000.0, "error_rate": 30.0, "hint_rate": 10.0},
        {"accuracy": 75.0, "average_response_time_ms": 4800.0, "error_rate": 25.0, "hint_rate": 10.0},
        {"accuracy": 80.0, "average_response_time_ms": 4600.0, "error_rate": 20.0, "hint_rate": 5.0},
        {"accuracy": 75.0, "average_response_time_ms": 4700.0, "error_rate": 25.0, "hint_rate": 10.0},
    ]
    baseline = BaselineEngine.calculate_initial_baseline(samples)
    assert baseline is None


def test_baseline_created_with_five_samples():
    samples = [
        {"accuracy": 70.0, "average_response_time_ms": 5000.0, "error_rate": 30.0, "hint_rate": 10.0},
        {"accuracy": 75.0, "average_response_time_ms": 4800.0, "error_rate": 25.0, "hint_rate": 10.0},
        {"accuracy": 80.0, "average_response_time_ms": 4600.0, "error_rate": 20.0, "hint_rate": 5.0},
        {"accuracy": 75.0, "average_response_time_ms": 4700.0, "error_rate": 25.0, "hint_rate": 10.0},
        {"accuracy": 70.0, "average_response_time_ms": 4900.0, "error_rate": 30.0, "hint_rate": 10.0},
    ]
    baseline = BaselineEngine.calculate_initial_baseline(samples)
    assert baseline is not None
    assert baseline["sample_count"] == 5
    assert baseline["baseline_accuracy"] == 74.0
    assert baseline["baseline_response_time_ms"] == 4800.0


def test_baseline_gradual_update():
    current_baseline = {
        "baseline_accuracy": 70.0,
        "baseline_response_time_ms": 5000.0,
        "baseline_error_rate": 30.0,
        "baseline_hint_rate": 10.0,
        "sample_count": 5,
    }
    # One unusual high-scoring session
    new_metric = {
        "accuracy": 100.0,
        "average_response_time_ms": 2000.0,
        "error_rate": 0.0,
        "hint_rate": 0.0,
    }
    updated = BaselineEngine.update_baseline_gradual(current_baseline, new_metric)

    # With alpha=0.15: 0.85 * 70 + 0.15 * 100 = 59.5 + 15 = 74.5
    assert updated["baseline_accuracy"] == 74.5
    assert updated["sample_count"] == 6
    # Confirms single session did NOT cause abrupt jump to 100%
    assert updated["baseline_accuracy"] < 80.0


def test_baseline_comparison_direction():
    # Improving accuracy
    comp_acc = BaselineEngine.compare_with_baseline(current_val=85.0, baseline_val=70.0, metric_name="accuracy")
    assert comp_acc["direction"] == "improving"
    assert comp_acc["change"] == 15.0

    # Improving response time (lower RT is better)
    comp_rt = BaselineEngine.compare_with_baseline(current_val=3500.0, baseline_val=5000.0, metric_name="response_time")
    assert comp_rt["direction"] == "improving"
    assert comp_rt["change"] == -1500.0
