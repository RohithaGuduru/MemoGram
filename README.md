# 🧠 MEMOGRAM

### AI-Powered Cognitive Gaming & Memory Assistance Platform for Elderly Dementia Patients

MEMOGRAM is an AI-enabled cognitive gaming and memory assistance platform designed to support elderly users experiencing memory-related difficulties and dementia.

The platform combines cognitive games, medication and hydration reminders, family memories, caretaker support, multilingual accessibility, performance tracking, and AI-assisted insights into a single accessible application.

---

## 🎯 Problem Statement

Elderly people experiencing dementia and memory-related difficulties may face challenges with:

- Remembering daily routines
- Taking medicines on time
- Maintaining hydration
- Remembering family members and relationships
- Performing regular cognitive exercises
- Communicating comfortably through technology
- Allowing family members or caretakers to monitor daily activities

MEMOGRAM addresses these challenges through an accessible, AI-enabled digital platform.

---

## 💡 Our Solution

MEMOGRAM provides a patient-centered platform with a dedicated caretaker ecosystem.

The system combines:

- 🧠 Cognitive training games
- 💊 Medication reminders
- 💧 Hydration tracking
- 🚶 Step tracking
- 👨‍👩‍👧 Family memory assistance
- 📅 Appointment management
- 🗣️ Multilingual accessibility
- 📊 Cognitive performance analytics
- 🤖 AI-assisted insights
- 👩‍⚕️ Caretaker monitoring

The platform is designed with accessibility and simplicity in mind so that elderly users can interact with the system comfortably.

---

# ✨ Key Features

## 👴 Patient Portal

The patient portal provides:

- Personalized dashboard
- Medication reminders
- Hydration tracking
- Step tracking
- Cognitive games
- Family memories
- Appointments
- Alerts and notifications
- Voice interaction
- Language and font-size preferences
- Accessibility-focused interface

---

## 👩‍⚕️ Caretaker Portal

Caretakers can:

- Manage connected patients
- View patient information
- Manage medications
- Manage family information
- Manage appointments
- Monitor cognitive activity
- View reports and performance
- Review patient activity and insights
- Configure patient-related information

Patient and caretaker preferences are maintained independently.

---

# 🎮 Cognitive Games

MEMOGRAM currently includes **7 cognitive games**:

### 1. 🛒 Groceries Shopping

The player remembers a grocery list and then identifies the required items from a virtual market containing correct items and distractors.

### 2. 🧭 Daily Sequence + Journey Memory

The player remembers and reconstructs sequences involving daily routines and journeys.

### 3. 🥤 Cup Shuffle

The player tracks objects hidden beneath moving cups and identifies their final positions.

### 4. 🧩 Cultural Memory Match

A culturally oriented memory matching game involving categories and memory card pairs.

### 5. 👨‍👩‍👧 Family Memories

The player answers questions about family members and relationships using information configured by the caretaker.

### 6. 🖼️ Memory Mosaic — Build the Picture

The player reconstructs an image by arranging geometric pieces.

### 7. 🧱 Block Mind

A block-placement cognitive game involving grids, rows, columns, and spatial reasoning.

The games support adaptive difficulty and performance tracking.

---

# 💊 Medication Assistance

MEMOGRAM provides medication management functionality including:

- Medicine name
- Dosage
- Frequency
- Scheduled times
- Instructions
- Medication photographs
- Medication reminders
- "I Took It" interaction
- "Remind Later" interaction

Medication information can be managed through the patient/caretaker workflows.

---

# 💧 Hydration Tracking

Patients can configure:

- Daily hydration goal
- Start and end times
- Reminder intervals
- Hydration progress

The patient's configured hydration goal is reflected throughout the application.

---

# 🚶 Activity Tracking

MEMOGRAM includes daily activity tracking such as:

- Step count
- Cognitive activity
- Game activity
- Hydration progress

The default patient step target is:

**3,000 steps/day**

---

# 👨‍👩‍👧 Family Memories

The Family Memories system allows caretakers to configure family information that can be used for cognitive memory exercises.

Family information may include:

- Name
- Relationship
- Phone number
- Photograph

The Family Memories game can then ask relationship-based questions such as:

> "How is Rahul related to you?"

This allows cognitive exercises to use meaningful personal context.

---

# 🗣️ Multilingual Accessibility

MEMOGRAM is designed with multilingual accessibility for users in the North-Eastern region of India.

### UI Localization

The application supports UI localization for:

1. Assamese
2. Bodo
3. Manipuri / Meitei
4. Kokborok
5. Mizo
6. Khasi
7. Hindi
8. English (India)

Users can also configure:

- Normal text size
- Large text size
- Extra-large text size

Patient and caretaker language/font preferences are maintained independently.

### Voice

The current voice architecture uses:

- **Sarvam Saaras v3** for speech-to-text
- **Indic Parler-TTS** for local text-to-speech inference

Current voice support is implemented for selected languages supported by these providers, while additional languages remain part of the application's multilingual UI and planned voice expansion.

---

# 🤖 AI Capabilities

MEMOGRAM incorporates AI-assisted functionality for:

- Cognitive performance analysis
- Adaptive difficulty
- Personalized recommendations
- Voice intent processing
- Multilingual interaction
- Cognitive insights

The platform is designed so that cognitive activities can adapt according to user performance.

---

# 🔐 Authentication & Security

MEMOGRAM includes:

- Patient authentication
- Caretaker authentication
- JWT-based authentication
- Role-based access control
- Google authentication support
- Forgot Password workflow
- Password reset functionality
- Patient-caretaker relationship management

Environment variables and API credentials are kept outside the source repository.

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     MEMOGRAM        │
                    │    Web / Mobile     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React + TypeScript  │
                    │       Vite          │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │      Python         │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌───────────┐    ┌────────────┐   ┌────────────┐
        │ Database  │    │ AI Services│   │ Voice      │
        │           │    │            │   │ Services   │
        └───────────┘    └────────────┘   └────────────┘

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Capacitor

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- Uvicorn

## AI & Voice

- Google Gemini
- Sarvam AI — Saaras v3
- Indic Parler-TTS

## Authentication & Security

- JWT
- Role-Based Access Control
- Password reset workflow

## Database

- SQLite for local development
- PostgreSQL support for deployment

## Mobile

- Capacitor
- Android

---

# 📁 Project Structure

```text
MEMOGRAM/
│
├── Backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── scripts/
│   ├── tests/
│   └── .env.example
│
├── FRONT-END/
│   ├── android/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── package.json
│   └── capacitor.config.ts
│
└── README.md

🚀 Local Development
1. Clone the Repository
git clone https://github.com/RohithaGuduru/MemoGram.git
cd MemoGram

🐍 Backend Setup
Open a terminal and run:
cd Backend

Create a virtual environment:
python -m venv .venv

macOS / Linux
source .venv/bin/activate

Install the backend dependencies:
pip install -r requirements.txt

Configure your environment variables using:
Backend/.env.example

Create your local .env file and provide the required credentials.
Never commit .env to GitHub.

Start the backend:
uvicorn app.main:app --host 0.0.0.0 --port 8000

Backend health endpoint:
http://localhost:8000/health

🌐 Frontend Setup
Open another terminal:
cd FRONT-END

Install dependencies:
npm install

Start the development server:
npm run dev

The Vite development server will display the local application URL in the terminal.
🏗️ Production Build
To create a production frontend build:

cd FRONT-END
npm run build

The production files are generated in:
FRONT-END/dist/

📱 Android
The project includes a Capacitor Android application.
The Android project is located at:
FRONT-END/android/

The web application can be synchronized with the Android project using Capacitor.
🧪 Testing
Backend tests can be executed using:
cd Backend

pytest -v
Frontend production build:
cd FRONT-END
npm run build

🔑 Environment Variables
MEMOGRAM uses environment variables for external services and credentials.
Refer to:
Backend/.env.example

for the required configuration.
Do not commit API keys, passwords, tokens, or other secrets to GitHub.

🌍 Deployment
The frontend is designed to be deployed as a web application and the backend can be deployed as a separate FastAPI service.
For production deployment:
User
  │
  ▼
Frontend Hosting
  │
  │ HTTPS API Requests
  ▼
FastAPI Backend
  │
  ▼
Production Database

The frontend API base URL should point to the deployed backend rather than:
http://localhost:8000

👥 Team
Team AspireGen

MEMOGRAM was developed as a Smart India Hackathon project by Team AspireGen.
📚 References
- NHS — Dementia and Cognitive Stimulation
- World Health Organization — Dementia
- PubMed — Cognitive Stimulation Research
- Sarvam AI — Speech Technology
- Bhashini — Indian Language Technology
- C-DAC — Language Technology Research
- AI4Bharat — Indic Language AI

❤️ MEMOGRAM
Making memory support more accessible, engaging, and meaningful.
Built for accessible cognitive assistance and elderly care.