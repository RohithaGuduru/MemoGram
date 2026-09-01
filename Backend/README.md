# AI-Powered Cognitive Assistance & Elderly-Care Platform Backend

A modular, explainable, offline-first compatible, and secure FastAPI backend engineered for elderly users (including remote and low-connectivity regions such as North-Eastern India) and their caregivers.

The platform powers:
1. **A Flutter Mobile/Tablet App** used by elderly patients for daily cognitive activities, routine reminders, and family engagement.
2. **A Caregiver Web Dashboard** providing activity-performance summaries, trends, and supportive alerts.

---

## ⚠️ Non-Diagnostic & Ethical AI Policy

> **CRITICAL MEDICAL DISCLAIMER**: This application is strictly an **adaptive cognitive activity engagement tool**. It **DOES NOT** diagnose dementia, Alzheimer's disease, or any medical condition.
>
> **Standard Terminology Used Throughout**:
> * *Activity Performance*
> * *Cognitive Engagement*
> * *Performance Trend*
> * *Activity Recommendation*

---

## 🌟 Key Features

* **Adaptive Cognitive Loop**:
  ```
  PATIENT ──▶ PLAY GAME ──▶ RAW TELEMETRY ──▶ PREPROCESSING ──▶ METRICS CALCULATION
                                                                      │
  NEXT ACTIVITY ◀── GAME RECOMMENDER ◀── DIFFICULTY ENGINE ◀── PATIENT BASELINE & TRENDS
  ```
* **Explainable AI Modules**:
  * `app/ai/preprocessing.py`: Sanitizes telemetry and removes accidental taps (<100ms) or interrupted pauses (>180s).
  * `app/ai/metrics.py`: Computes Accuracy, Error Rate, Mean/Median Response Times, Hint Rate, and Completion Rate.
  * `app/ai/baseline.py`: Patient-specific 5-session baseline bootstrapping with gradual exponential moving updates ($\alpha=0.15$).
  * `app/ai/trend.py`: 3-session sliding-window trajectory classification (`IMPROVING`, `STABLE`, `DECLINING`, `INSUFFICIENT_DATA`).
  * `app/ai/difficulty_engine.py`: Transparent rules-based difficulty adaptation with explainable reasoning.
  * `app/ai/game_recommender.py`: Multi-factor cognitive variety balancer and daily engagement planner.
  * `app/ai/insight_engine.py`: Generates supportive, non-medical natural language summaries for caregivers.
* **Offline-First Synchronization (`/api/v1/sync`)**:
  * Designed for remote regions with intermittent internet connectivity.
  * Batch push & pull with client-generated UUIDs, unique operation IDs, and full idempotency.
* **Caregiver-Patient RBAC & Tenancy**:
  * JWT Bearer authentication with Bcrypt password hashing.
  * Strict data isolation: Caregivers can only access their assigned patients; patients can only access their own data.
* **Culturally Contextualized Content**:
  * Metadata support for localized assets (e.g., Assamese Bihu instruments, Kaziranga fauna, Muga silk weaving motifs).
  * Multilingual support (`en`, `hi`, `as`, `bn`, `mni`).

---

## 🛠️ Tech Stack

* **Language**: Python 3.12+ (compatible with Python 3.9+)
* **Framework**: FastAPI
* **Validation**: Pydantic v2
* **ORM**: SQLAlchemy 2.x
* **Database**: PostgreSQL (with SQLite fallback for rapid local prototyping)
* **Migrations**: Alembic
* **Security**: JWT (`python-jose`), Passlib with Bcrypt
* **Containerization**: Docker & Docker Compose
* **Testing**: Pytest & HTTPX

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── main.py                   # FastAPI initialization, CORS, global exception handlers
│   ├── core/                     # Config, security (JWT/Bcrypt), dependencies (RBAC), logging
│   ├── db/                       # SQLAlchemy engine, session maker, Base models
│   ├── models/                   # DB ORM models (User, Patient, Caregiver, Game, Session, etc.)
│   ├── schemas/                  # Pydantic v2 request/response schemas
│   ├── services/                 # Business logic services (Auth, Patient, Game, Sync, Reports)
│   ├── ai/                       # Explainable AI engines (Metrics, Baseline, Trend, Difficulty, Recs)
│   └── utils/                    # Enums, timestamp helpers, pagination
├── scripts/
│   └── seed_data.py              # Populates realistic mock data (1 Caregiver, 2 Patients, 5 Games, Sessions)
├── tests/                        # Comprehensive test suites (35 tests covering all domains & AI)
├── Dockerfile                    # Production Docker container
├── docker-compose.yml            # Multi-container setup (Backend + PostgreSQL 16)
├── requirements.txt              # Pinned Python dependencies
├── pytest.ini                    # Pytest testpath & pythonpath config
├── alembic.ini                   # Database migrations configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### Option 1: Running with Docker Compose (Recommended)

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start PostgreSQL and the FastAPI backend:
   ```bash
   docker compose up --build
   ```
3. The server will start on `http://localhost:8000`.
4. Open the interactive OpenAPI documentation:
   * **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   * **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Option 2: Running Locally with Python Virtual Environment

1. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # On Windows: .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Seed the development database with test accounts & cultural games:
   ```bash
   python -m scripts.seed_data
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 🔑 Pre-Seeded Development Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Caregiver** | `caregiver@elderlycare.org` | `Caregiver@123` | Dr. Priya Sharma (North-East Elders Care) |
| **Patient 1** | `ananya.das@example.com` | `Patient@123` | Ananya Das (Assam, Assamese language, 6 game sessions) |
| **Patient 2** | `bijoy.sangma@example.com` | `Patient@123` | Bijoy Sangma (Meghalaya, High contrast preferences) |

---

## 📱 Flutter Mobile Integration Guide

### 1. Offline Sync Push (`POST /api/v1/sync/push`)
When the Flutter SQLite client reconnects to Wi-Fi/cellular network, it pushes queued offline operations:
```json
{
  "device_id": "samsung-tab-a9-001",
  "patient_id": "<patient-uuid>",
  "operations": [
    {
      "operation_id": "op-550e8400-e29b-41d4-a716-446655440000",
      "entity_type": "GAME_RESULT",
      "entity_id": "<session-uuid>",
      "operation": "CREATE",
      "timestamp": "2026-08-29T10:15:46.000Z",
      "data": {
        "session_id": "<session-uuid>",
        "total_questions": 10,
        "correct_answers": 8,
        "incorrect_answers": 2,
        "total_time_ms": 42000,
        "response_times": [4100, 3900, 4500, 4200, 3800, 4600, 4100, 4300, 4200, 4300]
      }
    }
  ]
}
```
* **Idempotency Guarantee**: If a network glitch causes the mobile client to retry the request, existing `operation_id` records are recognized and duplicate metrics/inserts are prevented.

### 2. Daily Activity Plan (`GET /api/v1/patients/{id}/activities/today`)
Returns the personalized daily routine schedule with localized morning greetings and diverse cognitive exercises:
```json
{
  "patient_id": "...",
  "date": "2026-08-29",
  "greeting": "নমস্কাৰ! আজিৰ বাবে আপোনাৰ কাৰ্যকলাপ পৰিকল্পনা সাজু হৈছে।",
  "activities": [
    {
      "game_id": "...",
      "game_name": "Family & Heritage Memory Match",
      "type": "MEMORY",
      "difficulty": 2,
      "reason": "Personalized for daily cognitive stimulation in Memory.",
      "estimated_duration_minutes": 5,
      "is_completed": false
    }
  ]
}
```

---

## 🧪 Running Automated Tests

Execute the full test suite with Pytest:
```bash
source .venv/bin/activate
pytest -v
```

### Test Coverage Highlights:
* `tests/test_ai_metrics.py`: Accuracy, Error Rate, Response Times, Hint Rate calculations.
* `tests/test_ai_baseline.py`: 5-session baseline establishment & $\alpha$-EMA stability.
* `tests/test_ai_trend.py`: 3-session sliding-window trend directions.
* `tests/test_ai_difficulty_engine.py`: Adaptive step increase, decrease, and boundary clamping.
* `tests/test_ai_recommender.py`: Category variety scoring, anti-repetition filter, and daily plans.
* `tests/test_auth.py`: Registration, login, token refresh, and `/me` identity.
* `tests/test_patients_and_rbac.py`: Strict caregiver-to-patient tenancy and cross-patient access blocks.
* `tests/test_games_and_sessions.py`: Game catalog, session start, and idempotent duplicate submission prevention.
* `tests/test_reports_insights_alerts.py`: Weekly performance aggregation and non-diagnostic insights.
* `tests/test_sync.py`: Batch offline sync push & pull with conflict-free idempotency.

---

## 🛡️ Security & Privacy

* Passwords hashed using **Bcrypt** with salt rounds.
* API requests protected via **JWT Bearer tokens** with expiration and role claims.
* Sanitized logging masks sensitive fields (`password`, `token`, `secret`) to prevent log leaks.
* Patient medical privacy respected through strict role-based data partitioning.
