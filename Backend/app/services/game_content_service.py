import json
from typing import Dict, Any, List
from app.core.config import settings
from app.schemas.memogram import GameContentGenerateRequest, GameContentGenerateResponse
from app.services.gemini_service import GeminiService


class GameContentService:
    """
    Game/Content AI layer powered by Google Gemini.
    Generates dynamic question pools, item lists, and cultural memory prompts.
    CRITICAL RULE: Never determines scoring, correctness, difficulty, or medical interpretation.
    """

    # Pre-defined deterministic fallbacks for all 5 Memogram games
    STATIC_GAME_TEMPLATES: Dict[str, Dict[str, Any]] = {
        "MEM_SHOPPING": {
            "title": "Weekly Market Shopping Recall",
            "instructions": "Memorize the list of household and kitchen items, then pick them from the store shelves.",
            "items": [
                {"name": "Assam Tea Leaves", "category": "Pantry", "icon": "tea_leaves"},
                {"name": "Fresh Ginger", "category": "Vegetables", "icon": "ginger"},
                {"name": "Muga Silk Thread", "category": "Crafts", "icon": "silk"},
                {"name": "Mustard Oil", "category": "Pantry", "icon": "oil"},
            ],
            "cultural_context": "Traditional weekly haat / market in North-East India.",
        },
        "DAILY_ROUTINE": {
            "title": "Morning Routine Sequencing",
            "instructions": "Arrange the daily morning habits in proper logical order.",
            "items": [
                {"step_number": 1, "description": "Drink warm water with honey"},
                {"step_number": 2, "description": "Take a 15-minute garden walk"},
                {"step_number": 3, "description": "Enjoy breakfast and morning medication"},
            ],
            "cultural_context": "Calm, healthy morning wellness routine.",
        },
        "CUP_SHUFFLE": {
            "title": "Three Cups Focus & Visual Tracking",
            "instructions": "Watch the traditional brass bowl carefully as it shuffles, and tap where the coin is hidden.",
            "items": [
                {"cup_count": 3, "shuffle_speed_ms": 1200, "target_item": "Golden Coin"},
            ],
            "cultural_context": "Traditional focus and visual attention exercise.",
        },
        "CULTURAL_MEMORY": {
            "title": "North-Eastern Heritage & Artifacts Recall",
            "instructions": "Pair the traditional cultural symbols, folk musical instruments, and regional handlooms.",
            "items": [
                {"name": "Bihu Dhol", "region": "Assam", "type": "Instrument"},
                {"name": "Japi Hat", "region": "Assam", "type": "Craft"},
                {"name": "Dhol & Pepa", "region": "Assam", "type": "Music"},
                {"name": "Kaziranga Rhino", "region": "Assam", "type": "Wildlife"},
            ],
            "cultural_context": "Celebrating Assam & North-Eastern cultural heritage.",
        },
        "FAMILY_MEMORIES": {
            "title": "Family Stories & Cherished Moments",
            "instructions": "Recall the family gathering from the photo and identify your loved ones.",
            "items": [
                {"prompt": "Who is celebrating their birthday in this photo?", "options": ["Son", "Granddaughter", "Brother"], "relation": "Family"},
                {"prompt": "Which festival were you celebrating together?", "options": ["Rongali Bihu", "Diwali", "New Year"], "relation": "Celebration"},
            ],
            "cultural_context": "Personalized family memories and joyful moments.",
        },
    }

    @classmethod
    def generate_game_content(
        cls,
        req: GameContentGenerateRequest,
    ) -> GameContentGenerateResponse:
        code = req.game_code.upper()
        template = cls.STATIC_GAME_TEMPLATES.get(code, cls.STATIC_GAME_TEMPLATES["MEM_SHOPPING"])

        # Try Gemini dynamic variation if configured
        if settings.GEMINI_API_KEY and GeminiService.is_available():
            try:
                system_prompt = (
                    "You are the Game Content AI for Memogram, an elderly cognitive assistance platform. "
                    "Generate gentle, culturally resonant item lists or question variations for the requested game. "
                    "Output valid JSON only with keys: title, instructions, items, cultural_context. "
                    "Do NOT include clinical or diagnostic statements."
                )
                user_msg = f"Game Code: {code}, Difficulty: {req.difficulty}, Theme: {req.theme}, Language: {req.language}"
                res = GeminiService.generate_structured_json(prompt=user_msg, system_instruction=system_prompt)
                if res and "items" in res:
                    return GameContentGenerateResponse(
                        game_code=code,
                        difficulty=req.difficulty,
                        language=req.language,
                        title=res.get("title", template["title"]),
                        instructions=res.get("instructions", template["instructions"]),
                        items=res.get("items", template["items"]),
                        cultural_context=res.get("cultural_context", template["cultural_context"]),
                    )
            except Exception:
                pass

        # Fallback to static verified game template
        return GameContentGenerateResponse(
            game_code=code,
            difficulty=req.difficulty,
            language=req.language,
            title=template["title"],
            instructions=template["instructions"],
            items=template["items"],
            cultural_context=template["cultural_context"],
        )
