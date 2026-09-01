# MindEase Backend — Google Gemini AI Integration Guide

This guide details how to configure, run, and test the Gemini AI integration within the MindEase backend platform.

---

## 1. Overview

Gemini AI adds two capabilities to the MindEase platform:
1. **Elderly Voice Assistant**: Real-time voice interaction with Gemini Live API, supporting conversational assistance, reminder lookups, next activity recommendations, and multilingual support (English, Hindi, Assamese, Bengali, Manipuri).
2. **Caregiver AI Insights**: Structured weekly/monthly activity summaries and supportive, non-medical observations derived from performance metrics, baselines, and trend engines.

> [!IMPORTANT]
> **Non-Diagnostic Safety Guarantee**:
> Gemini acts strictly as an assistance and natural-language explanation layer. It never diagnoses dementia, never makes clinical pronouncements regarding cognitive decline, and never replaces the deterministic adaptive difficulty engine.

---

## 2. How to Create a Gemini API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. In the left navigation menu, click **Get API key**.
4. Click **Create API key** (you can create a new project or select an existing Google Cloud project).
5. Copy the generated API key.

---

## 3. How to Configure the Backend

1. In the backend root directory, create or edit your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Add your `GEMINI_API_KEY` to `.env`:
   ```dotenv
   GEMINI_API_KEY="your-gemini-api-key-here"
   GEMINI_MODEL="gemini-2.5-flash"
   GEMINI_VOICE_MODEL="gemini-2.0-flash"
   ```

> [!CAUTION]
> Never commit your `.env` file or hardcode your API key in source code. `.env` is listed in `.gitignore` by default.

---

## 4. How to Run the Backend

1. Install backend requirements:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Access interactive Swagger API documentation at:
   [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 5. How to Test AI Endpoints

### A. AI Health & Status Check
```bash
curl -X GET http://localhost:8000/api/v1/ai/status
```
Response:
```json
{
  "available": true,
  "status": "operational",
  "model": "gemini-2.5-flash",
  "voice_model": "gemini-2.0-flash",
  "voice_enabled": true,
  "supported_languages": ["en", "hi", "as", "bn", "mni"],
  "message": "Gemini AI services and Live Voice assistant are operational."
}
```

---

### B. Authorize Voice Assistant Session
```bash
curl -X POST http://localhost:8000/api/v1/ai/voice/session \
  -H "Authorization: Bearer <CAREGIVER_OR_PATIENT_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "<PATIENT_UUID>",
    "preferred_language": "as",
    "voice_name": "Puck"
  }'
```
Response:
```json
{
  "session_id": "voice_sess_abc123",
  "patient_id": "<PATIENT_UUID>",
  "websocket_url": "/api/v1/ai/voice/ws/voice_sess_abc123",
  "ephemeral_token": "<SAFE_EPHEMERAL_TOKEN>",
  "expires_in": 3600,
  "language": "as",
  "model": "gemini-2.0-flash",
  "system_instruction": "..."
}
```

---

### C. Conversational Chat & Backend Function Calling
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "<PATIENT_UUID>",
    "message": "When is my next medicine?",
    "language": "en"
  }'
```
Response:
```json
{
  "reply": "Your scheduled medications include Donepezil 5mg at 08:00 Morning. Please take it with water after breakfast.",
  "language": "en",
  "tool_calls_executed": ["get_medication_schedule"],
  "available": true,
  "model": "gemini-2.5-flash"
}
```

---

### D. Generate Caregiver AI Insights
```bash
curl -X POST http://localhost:8000/api/v1/ai/insights/<PATIENT_UUID> \
  -H "Authorization: Bearer <CAREGIVER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "force_refresh": true,
    "timeframe": "week"
  }'
```
Response:
```json
{
  "id": "<INSIGHT_UUID>",
  "patient_id": "<PATIENT_UUID>",
  "summary": "The patient completed 8 activity sessions with 82% average accuracy and 90% routine adherence.",
  "positive_observations": [
    "Memory activity accuracy was 8% above recent baseline.",
    "Consistent routine with high medication adherence."
  ],
  "areas_to_watch": [
    "Occasional hesitation noted during rapid visual pattern matching."
  ],
  "activity_observations": [
    "Memory activities showed upward performance over recent sessions."
  ],
  "suggested_actions": [
    "Encourage short 3-to-5 minute exercises in the morning.",
    "Ensure comfortable hydration before activity sessions."
  ],
  "confidence": "high",
  "model": "gemini-2.5-flash",
  "source_metrics_version": "v1.0",
  "generated_at": "2026-08-30T00:00:00Z"
}
```

---

## 6. How to Run Without Gemini (Offline / Missing API Key Mode)

MindEase is designed with an offline-first, failure-tolerant architecture:
1. When `GEMINI_API_KEY` is not provided (or empty), the system automatically enters **Deterministic Mode**.
2. All cognitive games, difficulty adjustments, baseline calculations, trend detections, reminders, and sync endpoints continue working 100% normally.
3. Caregiver insights are generated deterministically using the built-in `InsightEngine` rules without interruption.
4. Voice assistant gracefully returns:
   ```json
   {
     "available": false,
     "status": "api_key_missing",
     "message": "Voice assistance is temporarily unavailable."
   }
   ```

---

## 7. Running Automated Tests

Run the full backend test suite:
```bash
pytest -v
```
All 59 unit and integration tests (including auth, games, metrics, baseline, difficulty engine, trend engine, sync, and Gemini AI) will execute in isolated test environments.
