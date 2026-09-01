import pytest
from datetime import date, datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # Ensure all SQLAlchemy models are registered in Base.metadata
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.caregiver import Caregiver
from app.models.patient import Patient
from app.models.caregiver_patient import CaregiverPatient
from app.models.game import Game
from app.utils.enums import UserRole, GameCategory


# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Provides a fresh, isolated database session for each test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_test_data(db):
    """Seeds essential users and games for test suites."""
    now = datetime.now(timezone.utc)

    # 1. Caregiver User
    cg_user = User(
        email="caregiver_test@example.com",
        phone="+919876500001",
        hashed_password=get_password_hash("Caregiver@123"),
        full_name="Dr. Sunita Barua",
        role=UserRole.CAREGIVER,
        is_active=True,
    )
    db.add(cg_user)
    db.flush()

    cg = Caregiver(user_id=cg_user.id, agency="Guwahati Elder Health")
    db.add(cg)
    db.flush()

    # 2. Patient User & Profile
    p_user = User(
        email="patient_test@example.com",
        phone="+919876500002",
        hashed_password=get_password_hash("Patient@123"),
        full_name="Bhaben Bora",
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(p_user)
    db.flush()

    patient = Patient(
        user_id=p_user.id,
        date_of_birth=date(1949, 3, 10),
        preferred_language="as",
        font_size="large",
        timezone="Asia/Kolkata",
        voice_preference="female_calm",
        interests=["nature", "music"],
        accessibility_preferences={"touch_target_size": "large"},
    )
    db.add(patient)
    db.flush()

    # Associate Caregiver and Patient
    assoc = CaregiverPatient(
        caregiver_id=cg.id,
        patient_id=patient.id,
        relation_type="primary_caregiver",
        is_primary=True,
    )
    db.add(assoc)

    # 3. Unassigned Caregiver (for RBAC testing)
    other_cg_user = User(
        email="other_cg@example.com",
        phone="+919876500003",
        hashed_password=get_password_hash("Caregiver@123"),
        full_name="Other Caregiver",
        role=UserRole.CAREGIVER,
        is_active=True,
    )
    db.add(other_cg_user)
    db.flush()
    other_cg = Caregiver(user_id=other_cg_user.id, agency="Other Agency")
    db.add(other_cg)

    # 4. Standard Game
    game = Game(
        code="MEM_PHOTO_TEST",
        name="Memory Test Game",
        category=GameCategory.MEMORY,
        description="Test memory game",
        min_difficulty=1,
        max_difficulty=5,
        default_config={"pairs": 3},
        metadata_info={},
        is_active=True,
    )
    db.add(game)
    db.commit()

    return {
        "caregiver_user": cg_user,
        "caregiver": cg,
        "patient_user": p_user,
        "patient": patient,
        "other_caregiver_user": other_cg_user,
        "game": game,
    }


@pytest.fixture
def caregiver_auth_headers(seed_test_data):
    user = seed_test_data["caregiver_user"]
    token = create_access_token(subject=user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient_auth_headers(seed_test_data):
    user = seed_test_data["patient_user"]
    token = create_access_token(subject=user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_caregiver_auth_headers(seed_test_data):
    user = seed_test_data["other_caregiver_user"]
    token = create_access_token(subject=user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}
