from app.ai.game_recommender import GameRecommender
from app.utils.enums import GameCategory


def test_recommender_avoids_repeating_last_category():
    active_games = [
        {"id": "g-mem", "code": "MEM_01", "name": "Memory Game", "category": GameCategory.MEMORY, "min_difficulty": 1, "max_difficulty": 5, "is_active": True},
        {"id": "g-attn", "code": "ATTN_01", "name": "Attention Game", "category": GameCategory.ATTENTION, "min_difficulty": 1, "max_difficulty": 5, "is_active": True},
        {"id": "g-pat", "code": "PAT_01", "name": "Pattern Game", "category": GameCategory.PATTERN_RECOGNITION, "min_difficulty": 1, "max_difficulty": 5, "is_active": True},
    ]
    # Patient just played MEMORY
    recent_sessions = [
        {"game_category": GameCategory.MEMORY, "difficulty": 1},
    ]

    rec = GameRecommender.recommend_next_activity(
        active_games=active_games,
        recent_sessions=recent_sessions,
        patient_interests=[],
    )

    # Should recommend ATTENTION or PATTERN, avoiding immediate MEMORY repeat
    assert rec["game_category"] != GameCategory.MEMORY
    assert rec["game_category"] in [GameCategory.ATTENTION, GameCategory.PATTERN_RECOGNITION]


def test_daily_activity_plan_generation():
    active_games = [
        {"id": "g1", "code": "MEM_01", "name": "Memory", "category": GameCategory.MEMORY, "min_difficulty": 1, "max_difficulty": 5, "is_active": True},
        {"id": "g2", "code": "ATTN_01", "name": "Attention", "category": GameCategory.ATTENTION, "min_difficulty": 1, "max_difficulty": 5, "is_active": True},
        {"id": "g3", "code": "PAT_01", "name": "Pattern", "category": GameCategory.PATTERN_RECOGNITION, "min_difficulty": 1, "max_difficulty": 5, "is_active": True},
    ]

    plan = GameRecommender.generate_daily_plan(
        patient_id="p-123",
        active_games=active_games,
        recent_sessions=[],
        patient_interests=["nature"],
        preferred_language="as",
    )

    assert plan["patient_id"] == "p-123"
    assert len(plan["activities"]) > 0
    assert "নমস্কাৰ" in plan["greeting"]  # Assamese greeting
