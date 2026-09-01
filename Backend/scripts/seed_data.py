from datetime import date, datetime, timedelta, time, timezone
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.database import engine, SessionLocal
from app.models.user import User
from app.models.caregiver import Caregiver
from app.models.patient import Patient
from app.models.relationship import PatientCaretakerRelationship
from app.models.family_member import FamilyMember
from app.models.medication import Medication
from app.models.reminder import Reminder, ReminderLog
from app.models.game import Game
from app.models.game_session import GameSession
from app.models.game_result import GameResult
from app.models.performance_metric import PerformanceMetric
from app.models.baseline import Baseline
from app.models.performance_trend import PerformanceTrend
from app.models.cultural_asset import CulturalAsset
from app.services.language_service import LanguageService
from app.utils.enums import UserRole, GameCategory, SessionStatus, ReminderType, TrendDirection, RelationshipStatus


def seed_database():
    print("Seeding MEMOGRAM database with test fixtures and mock data...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_caregiver = db.query(User).filter(
            (User.email == "caregiver@elderlycare.org") | (User.email == "caretaker@memogram.app")
        ).first()
        if existing_caregiver:
            print("Database already seeded. Initializing language registry...")
            LanguageService.initialize_registry_if_needed(db)
            return

        now = datetime.now(timezone.utc)

        # 0. Initialize Multilingual Registry
        LanguageService.initialize_registry_if_needed(db)

        # 1. Create Caretaker User
        cg_user = User(
            email="caregiver@elderlycare.org",
            phone="+919876543210",
            hashed_password=get_password_hash("Caregiver@123"),
            full_name="Priya Sharma",
            role=UserRole.CARETAKER,
            is_active=True,
        )
        db.add(cg_user)
        db.flush()

        cg_profile = Caregiver(
            user_id=cg_user.id,
            agency="North-East Elders Care Foundation",
            notes="Experienced elder care specialist covering Guwahati and Shillong regions.",
            relationship_with_patient="Primary Caretaker",
            created_at=now,
        )
        db.add(cg_profile)
        db.flush()

        # 2. Create Patient 1: Ananya Das (Assam)
        p1_user = User(
            email="ananya.das@example.com",
            phone="+919876543211",
            hashed_password=get_password_hash("Patient@123"),
            full_name="Ananya Das",
            role=UserRole.PATIENT,
            is_active=True,
        )
        db.add(p1_user)
        db.flush()

        patient1 = Patient(
            user_id=p1_user.id,
            date_of_birth=date(1950, 4, 15),
            gender="Female",
            primary_language="as",  # Assamese
            fallback_language="en",
            preferred_language="as",
            font_size="large",
            timezone="Asia/Kolkata",
            voice_preference="female_calm",
            emergency_contact_name="Rahul Das (Son)",
            emergency_contact_phone="+919811122233",
            interests=["nature", "folk_music", "gardening", "traditional_cooking", "tea_plantations"],
            accessibility_preferences={
                "high_contrast": False,
                "screen_reader_friendly": True,
                "haptic_feedback": True,
                "audio_cues": True,
                "touch_target_size": "extra_large",
            },
            created_at=now - timedelta(days=30),
            updated_at=now,
        )
        db.add(patient1)
        db.flush()

        assoc1 = PatientCaretakerRelationship(
            caregiver_id=cg_profile.id,
            patient_id=patient1.id,
            relation_type="primary_caretaker",
            status=RelationshipStatus.ACTIVE,
            is_primary=True,
            created_at=now - timedelta(days=30),
            updated_at=now,
        )
        db.add(assoc1)

        # 3. Create Patient 2: Bijoy Sangma (Meghalaya)
        p2_user = User(
            email="bijoy.sangma@example.com",
            phone="+919876543212",
            hashed_password=get_password_hash("Patient@123"),
            full_name="Bijoy Sangma",
            role=UserRole.PATIENT,
            is_active=True,
        )
        db.add(p2_user)
        db.flush()

        patient2 = Patient(
            user_id=p2_user.id,
            date_of_birth=date(1948, 11, 20),
            gender="Male",
            primary_language="en",
            fallback_language="hi",
            preferred_language="en",
            font_size="extra_large",
            timezone="Asia/Kolkata",
            voice_preference="male_calm",
            emergency_contact_name="Mary Sangma (Daughter)",
            emergency_contact_phone="+919811122255",
            interests=["nature", "woodcraft", "local_history", "birds"],
            accessibility_preferences={
                "high_contrast": True,
                "screen_reader_friendly": True,
                "haptic_feedback": True,
                "audio_cues": True,
                "touch_target_size": "extra_large",
            },
            created_at=now - timedelta(days=20),
            updated_at=now,
        )
        db.add(patient2)
        db.flush()

        assoc2 = PatientCaretakerRelationship(
            caregiver_id=cg_profile.id,
            patient_id=patient2.id,
            relation_type="primary_caretaker",
            status=RelationshipStatus.ACTIVE,
            is_primary=True,
            created_at=now - timedelta(days=20),
            updated_at=now,
        )
        db.add(assoc2)

        # 4. Family Members for Patient 1
        fm1 = FamilyMember(
            patient_id=patient1.id,
            name="Rahul Das",
            relation="Son",
            phone="+919811122233",
            notes="Works in Guwahati, visits on weekends.",
            is_emergency_contact=True,
        )
        fm2 = FamilyMember(
            patient_id=patient1.id,
            name="Rani Das",
            relation="Granddaughter",
            phone="+919811122244",
            notes="Loves singing Bihu songs with grandma.",
            is_emergency_contact=False,
        )
        db.add_all([fm1, fm2])

        # 5. Medications for Patient 1
        med1 = Medication(
            patient_id=patient1.id,
            name="Amlodipine",
            dosage="5mg",
            time_of_day="08:00 AM",
            frequency="daily",
            start_date=date(2026, 1, 1),
            instructions="Take after light breakfast with a glass of water.",
            is_active=True,
        )
        med2 = Medication(
            patient_id=patient1.id,
            name="Metformin",
            dosage="500mg",
            time_of_day="08:00 PM",
            frequency="daily",
            start_date=date(2026, 1, 1),
            instructions="Take with dinner.",
            is_active=True,
        )
        db.add_all([med1, med2])
        db.flush()

        # 6. Reminders for Patient 1
        rem1 = Reminder(
            patient_id=patient1.id,
            medication_id=med1.id,
            title="Morning Blood Pressure Medication",
            description="Take 1 tablet of Amlodipine 5mg",
            reminder_type=ReminderType.MEDICATION,
            scheduled_time=time(8, 0),
            recurrence_rule="DAILY",
            is_active=True,
        )
        rem2 = Reminder(
            patient_id=patient1.id,
            title="Morning Hydration & Tea",
            description="Drink a warm glass of water or herbal tea.",
            reminder_type=ReminderType.HYDRATION,
            scheduled_time=time(10, 30),
            recurrence_rule="DAILY",
            is_active=True,
        )
        rem3 = Reminder(
            patient_id=patient1.id,
            title="Daily Cognitive Memory Exercise",
            description="Spend 5 minutes recalling family photos and nature motifs.",
            reminder_type=ReminderType.COGNITIVE_ACTIVITY,
            scheduled_time=time(16, 0),
            recurrence_rule="DAILY",
            is_active=True,
        )
        db.add_all([rem1, rem2, rem3])

        # 7. Exact 5 Memogram Core Games Catalog
        games = [
            Game(
                code="MEM_SHOPPING",
                name="Memory Shopping",
                category=GameCategory.MEMORY,
                description="Recall and select items from your weekly shopping list at the local market.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"items_count": 4, "time_limit_sec": 120},
                metadata_info={"regional_tags": ["Market", "Pantry", "Memory"], "icon": "shopping_basket"},
                is_active=True,
            ),
            Game(
                code="DAILY_ROUTINE",
                name="Daily Routine",
                category=GameCategory.DAILY_ROUTINE_RECALL,
                description="Arrange everyday morning and evening routines in gentle logical order.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"steps_count": 3},
                metadata_info={"regional_tags": ["Daily Life", "Habits"], "icon": "checklist"},
                is_active=True,
            ),
            Game(
                code="CUP_SHUFFLE",
                name="Cup Shuffle",
                category=GameCategory.ATTENTION,
                description="Follow the moving brass cups and tap the cup hiding the coin.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"cup_count": 3, "shuffle_speed_ms": 1200},
                metadata_info={"regional_tags": ["Attention", "Focus"], "icon": "cup"},
                is_active=True,
            ),
            Game(
                code="CULTURAL_MEMORY",
                name="Cultural Memory",
                category=GameCategory.PATTERN_RECOGNITION,
                description="Recall and match traditional North-Eastern festivals, artifacts, monuments, and handloom patterns.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"card_pairs": 4, "theme": "heritage"},
                metadata_info={"regional_tags": ["Assam", "Bihu", "Cultural"], "icon": "memory_cards"},
                is_active=True,
            ),
            Game(
                code="FAMILY_MEMORIES",
                name="Family Memories & Stories",
                category=GameCategory.MEMORY,
                description="Recall cherished family moments, loved ones' photos, and shared stories.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"prompts_count": 3},
                metadata_info={"regional_tags": ["Family", "Stories"], "icon": "photo_album"},
                is_active=True,
            ),
            # Compatibility game codes
            Game(
                code="MEM_PHOTO_RECALL",
                name="Family & Heritage Memory Match",
                category=GameCategory.MEMORY,
                description="Recall and pair matching family cards and traditional North-Eastern cultural artifacts.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"card_pairs": 4, "time_limit_sec": 120, "theme": "heritage"},
                metadata_info={"regional_tags": ["Assam", "Bihu", "Cultural"], "icon": "memory_cards"},
                is_active=True,
            ),
            Game(
                code="ATTN_SPOT_DIFFERENCE",
                name="Kaziranga Wildlife Focus",
                category=GameCategory.ATTENTION,
                description="Spot gentle differences in scenic nature landscapes and serene wildlife scenes.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"items_to_spot": 3, "time_limit_sec": 180},
                metadata_info={"regional_tags": ["Kaziranga", "Fauna", "Nature"], "icon": "magnifying_glass"},
                is_active=True,
            ),
            Game(
                code="PAT_WEAVING_SEQUENCE",
                name="Muga Silk Pattern Weave",
                category=GameCategory.PATTERN_RECOGNITION,
                description="Complete traditional geometric textile and floral border patterns.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"sequence_length": 4, "pattern_type": "textile"},
                metadata_info={"regional_tags": ["Handloom", "Silk", "Patterns"], "icon": "pattern_grid"},
                is_active=True,
            ),
            Game(
                code="OBJ_HOUSEHOLD_FIND",
                name="Kitchen & Household Heritage Explorer",
                category=GameCategory.OBJECT_RECOGNITION,
                description="Identify familiar traditional utensils, brassware, and tea-making instruments.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"target_items": 3},
                metadata_info={"regional_tags": ["Utensils", "Household"], "icon": "tea_pot"},
                is_active=True,
            ),
            Game(
                code="ROU_DAILY_CHORE_SEQUENCE",
                name="Morning Garden Routine Order",
                category=GameCategory.DAILY_ROUTINE_RECALL,
                description="Arrange everyday morning routines in gentle logical order.",
                min_difficulty=1,
                max_difficulty=5,
                default_config={"steps_count": 3},
                metadata_info={"regional_tags": ["Daily Life", "Habits"], "icon": "checklist"},
                is_active=True,
            ),
        ]
        db.add_all(games)
        db.flush()

        # 8. Create 6 completed game sessions for Patient 1 to establish baseline & trend
        memory_game = games[0]
        session_dates = [
            now - timedelta(days=6),
            now - timedelta(days=5),
            now - timedelta(days=4),
            now - timedelta(days=3),
            now - timedelta(days=2),
            now - timedelta(days=1),
        ]
        accuracies = [70.0, 75.0, 75.0, 80.0, 85.0, 90.0]
        response_times = [6500, 6200, 5900, 5400, 4800, 4200]

        for idx, (s_date, acc, rt) in enumerate(zip(session_dates, accuracies, response_times)):
            sess = GameSession(
                client_session_id=f"seed-sess-ananya-{idx+1}",
                patient_id=patient1.id,
                game_id=memory_game.id,
                game_category=memory_game.category,
                difficulty=1 if idx < 4 else 2,
                device_id="samsung-tab-ananya-01",
                started_at=s_date,
                completed_at=s_date + timedelta(seconds=90),
                status=SessionStatus.COMPLETED,
            )
            db.add(sess)
            db.flush()

            correct = int(round(10 * (acc / 100.0)))
            incorrect = 10 - correct
            gres = GameResult(
                session_id=sess.id,
                patient_id=patient1.id,
                total_questions=10,
                correct_answers=correct,
                incorrect_answers=incorrect,
                errors_count=incorrect,
                attempts_count=10,
                hints_used=1 if acc < 80 else 0,
                total_time_ms=rt * 10,
                response_times=[rt] * 10,
                raw_events=[],
                submitted_at=s_date + timedelta(seconds=90),
            )
            db.add(gres)

            pm = PerformanceMetric(
                session_id=sess.id,
                patient_id=patient1.id,
                game_id=memory_game.id,
                game_category=memory_game.category,
                difficulty=sess.difficulty,
                accuracy=acc,
                error_rate=100.0 - acc,
                average_response_time_ms=float(rt),
                median_response_time_ms=float(rt),
                hint_rate=10.0 if acc < 80 else 0.0,
                completion_rate=100.0,
                attempts=10,
                created_at=s_date + timedelta(seconds=90),
            )
            db.add(pm)

        # Baseline record for Memory
        b_mem = Baseline(
            patient_id=patient1.id,
            game_category=GameCategory.MEMORY,
            difficulty_level=1,
            baseline_accuracy=75.0,
            baseline_response_time_ms=5800.0,
            baseline_error_rate=25.0,
            baseline_hint_rate=8.0,
            baseline_completion_rate=100.0,
            sample_count=5,
            last_updated_at=now - timedelta(days=2),
        )
        db.add(b_mem)

        # Performance Trend record
        trend_mem = PerformanceTrend(
            patient_id=patient1.id,
            game_category=GameCategory.MEMORY,
            metric_name="accuracy",
            window_size=3,
            previous_avg=73.33,
            recent_avg=85.0,
            percentage_change=15.91,
            trend_direction=TrendDirection.IMPROVING,
            calculated_at=now - timedelta(days=1),
        )
        db.add(trend_mem)

        # 9. Cultural Media Assets
        assets = [
            CulturalAsset(
                asset_code="AS_BIHU_DHOL",
                category="music",
                language="as",
                region="NE_INDIA",
                title="Bihu Dhol & Pepa",
                asset_url="https://assets.elderlycare.org/ne_india/music/bihu_dhol.webp",
                metadata_info={"description": "Traditional Assamese musical instruments used during Rongali Bihu."},
                is_active=True,
            ),
            CulturalAsset(
                asset_code="AS_KAZIRANGA_RHINO",
                category="nature",
                language="en",
                region="NE_INDIA",
                title="Kaziranga One-Horned Rhinoceros",
                asset_url="https://assets.elderlycare.org/ne_india/nature/one_horned_rhino.webp",
                metadata_info={"description": "Serene morning in Kaziranga National Park."},
                is_active=True,
            ),
            CulturalAsset(
                asset_code="AS_TEA_GARDEN",
                category="places",
                language="as",
                region="NE_INDIA",
                title="Jorhat Tea Estate",
                asset_url="https://assets.elderlycare.org/ne_india/places/tea_garden.webp",
                metadata_info={"description": "Lush green tea gardens of upper Assam."},
                is_active=True,
            ),
        ]
        db.add_all(assets)

        db.commit()
        print("MEMOGRAM database seeded successfully with Caretaker, Patients, 5 Core Games, Baselines, and Language Registry!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
