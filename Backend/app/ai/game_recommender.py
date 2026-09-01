from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import random

from app.utils.enums import GameCategory


class GameRecommender:
    """
    Intelligent Game & Activity Recommender Engine.
    
    Principles:
    - Balances cognitive domain variety (Memory, Attention, Pattern Recognition, Object Recognition, Routine Recall).
    - Identifies under-practiced domains and avoids repetitive activity fatigue.
    - Personalizes by matching patient interest tags and cultural preferences.
    - Produces explainable recommendations with target difficulty and rationale.
    """

    ALL_CATEGORIES = [
        GameCategory.MEMORY,
        GameCategory.ATTENTION,
        GameCategory.PATTERN_RECOGNITION,
        GameCategory.OBJECT_RECOGNITION,
        GameCategory.DAILY_ROUTINE_RECALL,
    ]

    @classmethod
    def recommend_next_activity(
        cls,
        active_games: List[Dict[str, Any]],
        recent_sessions: List[Dict[str, Any]],
        patient_interests: List[str],
        category_difficulties: Optional[Dict[str, int]] = None,
    ) -> Dict[str, Any]:
        """
        Determines the optimal next activity and difficulty for a patient.
        """
        if not active_games:
            raise ValueError("No active games available in catalog.")

        category_difficulties = category_difficulties or {}

        # 1. Compute recency distance for each category
        # Lower index in reversed sessions = more recently played
        category_recency: Dict[GameCategory, int] = {cat: 999 for cat in cls.ALL_CATEGORIES}
        last_played_category: Optional[GameCategory] = None

        if recent_sessions:
            last_played_category = recent_sessions[-1].get("game_category")
            for idx, session in enumerate(reversed(recent_sessions)):
                cat = session.get("game_category")
                if cat in category_recency and category_recency[cat] == 999:
                    category_recency[cat] = idx

        # 2. Score each category
        category_scores: List[Dict[str, Any]] = []
        for cat in cls.ALL_CATEGORIES:
            # Base score from recency (higher distance = higher priority)
            score = float(category_recency[cat])

            # Immediate repetition penalty: do not repeat the game category just played if possible
            if cat == last_played_category and len(recent_sessions) > 0:
                score *= 0.1

            # Interest alignment boost: if patient interests mention relevant terms
            cat_str = cat.value.lower()
            if any(interest.lower() in cat_str or cat_str in interest.lower() for interest in patient_interests):
                score += 5.0

            category_scores.append({"category": cat, "score": score})

        # Sort categories by highest recommendation score
        category_scores.sort(key=lambda x: x["score"], reverse=True)
        chosen_category = category_scores[0]["category"]

        # 3. Find candidate games in the chosen category
        matching_games = [g for g in active_games if g.get("category") == chosen_category and g.get("is_active", True)]
        if not matching_games:
            # Fallback to any active game
            matching_games = [g for g in active_games if g.get("is_active", True)]

        selected_game = matching_games[0]

        # 4. Target difficulty determination
        target_diff = category_difficulties.get(chosen_category.value, selected_game.get("min_difficulty", 1))
        target_diff = max(selected_game.get("min_difficulty", 1), min(selected_game.get("max_difficulty", 5), target_diff))

        # 5. Build human-readable explainable reason
        readable_cat = chosen_category.value.replace("_", " ").title()
        if category_recency[chosen_category] == 999:
            reason = f"Provides comprehensive cognitive variety; {readable_cat} activities have not been practiced recently."
        elif category_recency[chosen_category] >= 2:
            reason = f"Encourages well-rounded engagement by rotating into {readable_cat} exercises."
        else:
            reason = f"Personalized for daily cognitive stimulation in {readable_cat}."

        return {
            "game_id": selected_game["id"],
            "game_name": selected_game["name"],
            "game_code": selected_game.get("code", ""),
            "game_category": chosen_category,
            "target_difficulty": target_diff,
            "reason": reason,
            "confidence": 0.88,
        }

    @classmethod
    def generate_daily_plan(
        cls,
        patient_id: str,
        active_games: List[Dict[str, Any]],
        recent_sessions: List[Dict[str, Any]],
        patient_interests: List[str],
        preferred_language: str = "en",
    ) -> Dict[str, Any]:
        """
        Generates a 2-3 activity daily engagement plan tailored to the patient.
        """
        if not active_games:
            return {"patient_id": patient_id, "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "activities": []}

        # Select 2-3 diverse games
        selected_activities = []
        used_game_ids = set()

        for step in range(min(3, len(active_games))):
            rec = cls.recommend_next_activity(
                active_games=[g for g in active_games if g["id"] not in used_game_ids],
                recent_sessions=recent_sessions,
                patient_interests=patient_interests,
            )
            used_game_ids.add(rec["game_id"])
            selected_activities.append({
                "game_id": rec["game_id"],
                "game_name": rec["game_name"],
                "game_code": rec["game_code"],
                "type": rec["game_category"],
                "difficulty": rec["target_difficulty"],
                "reason": rec["reason"],
                "estimated_duration_minutes": 5,
                "is_completed": False,
            })

        # Culturally respectful, friendly morning greeting
        greetings = {
            "en": "Good day! Here is your personalized cognitive activity plan for today.",
            "hi": "नमस्ते! आज के लिए आपकी दैनिक गतिविधि योजना तैयार है।",
            "as": "নমস্কাৰ! আজিৰ বাবে আপোনাৰ কাৰ্যকলাপ পৰিকল্পনা সাজু হৈছে।",
            "bn": "নমস্কার! আজকের জন্য আপনার কার্যকলাপ পরিকল্পনা প্রস্তুত।",
        }
        greeting = greetings.get(preferred_language, greetings["en"])

        return {
            "patient_id": patient_id,
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "greeting": greeting,
            "activities": selected_activities,
            "daily_tip": "Playing games at a comfortable pace with good hydration supports optimal engagement.",
        }
