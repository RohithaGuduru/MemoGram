from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.patients import router as patients_router
from app.api.v1.caregivers import router as caregivers_router
from app.api.v1.caretakers import router as caretakers_router
from app.api.v1.relationships import router as relationships_router
from app.api.v1.languages import router as languages_router
from app.api.v1.voice import router as voice_router
from app.api.v1.games import router as games_router
from app.api.v1.game_events import router as game_events_router
from app.api.v1.performance import router as performance_router
from app.api.v1.adaptive import router as adaptive_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.medications import router as medications_router
from app.api.v1.medicines import router as medicines_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.sos import router as sos_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.family import router as family_router
from app.api.v1.activities import router as activities_router
from app.api.v1.reports import router as reports_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.sync import router as sync_router
from app.api.v1.ai import router as ai_router
from app.api.v1.health import router as health_router

api_router = APIRouter()

# Authentication & Users
api_router.include_router(auth_router)
api_router.include_router(users_router)

# Profiles & Relationships
api_router.include_router(patients_router)
api_router.include_router(caregivers_router)
api_router.include_router(caretakers_router)
api_router.include_router(relationships_router)

# Languages & Voice Assistant
api_router.include_router(languages_router)
api_router.include_router(voice_router)

# Games & Adaptive Cognitive Engine
api_router.include_router(games_router)
api_router.include_router(game_events_router)
api_router.include_router(performance_router)
api_router.include_router(adaptive_router)
api_router.include_router(recommendations_router)

# Medicines & Reminders
api_router.include_router(medications_router)
api_router.include_router(medicines_router)
api_router.include_router(reminders_router)

# SOS & Notifications
api_router.include_router(sos_router)
api_router.include_router(notifications_router)

# Supporting Services
api_router.include_router(family_router)
api_router.include_router(activities_router)
api_router.include_router(reports_router)
api_router.include_router(alerts_router)
api_router.include_router(sync_router)
api_router.include_router(ai_router)
api_router.include_router(health_router)
