import base64
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from app.models.patient import Patient
from app.services.providers.stt_router import STTRouter
from app.services.providers.tts_router import TTSRouter
from app.services.providers.indic_parler_provider import IndicParlerTTSProvider
from app.services.providers.sarvam_provider import SarvamProvider
from app.services.providers.bhashini_provider import BhashiniProvider
from app.services.providers.base import STTResult, TTSResult
from app.schemas.memogram import VoiceProcessRequest


# =============================================================================
# 1. STT Router Unit Tests (Sarvam Saaras v3)
# =============================================================================
def test_stt_router_provider_routing():
    router = STTRouter()
    # Sarvam Saaras v3 supported languages
    assert router.get_provider_for_language("as") == "sarvam"
    assert router.get_provider_for_language("as-IN") == "sarvam"
    assert router.get_provider_for_language("brx") == "sarvam"
    assert router.get_provider_for_language("brx-IN") == "sarvam"
    assert router.get_provider_for_language("mni") == "sarvam"
    assert router.get_provider_for_language("mni-IN") == "sarvam"
    assert router.get_provider_for_language("hi") == "sarvam"
    assert router.get_provider_for_language("hi-IN") == "sarvam"
    assert router.get_provider_for_language("en") == "sarvam"
    assert router.get_provider_for_language("en-IN") == "sarvam"

    # Unsupported voice languages (Bhashini removed from active STT routing)
    assert router.get_provider_for_language("trp") == "unsupported"
    assert router.get_provider_for_language("trp-IN") == "unsupported"
    assert router.get_provider_for_language("kokborok") == "unsupported"
    assert router.get_provider_for_language("lus") == "unsupported"
    assert router.get_provider_for_language("lus-IN") == "unsupported"
    assert router.get_provider_for_language("mizo") == "unsupported"
    assert router.get_provider_for_language("kha") == "unsupported"
    assert router.get_provider_for_language("kha-IN") == "unsupported"
    assert router.get_provider_for_language("khasi") == "unsupported"

    # Other unsupported language
    assert router.get_provider_for_language("fr") == "unsupported"


@pytest.mark.asyncio
async def test_stt_router_transcribe_all_7_languages():
    mock_sarvam = SarvamProvider(api_key="mock_key_12345")
    
    mock_sarvam.transcribe = AsyncMock(side_effect=lambda audio_data, language, content_type: STTResult(
        text=f"Transcribed via Sarvam for {language}",
        language=language,
        confidence=0.95,
        provider="sarvam",
    ))

    router = STTRouter(sarvam_provider=mock_sarvam)
    sample_audio = b"FAKE_AUDIO_BYTES_TEST"

    # Test Sarvam Saaras v3 supported languages
    for lang in ["as-IN", "brx-IN", "mni-IN", "hi-IN", "en-IN"]:
        res = await router.transcribe(sample_audio, language=lang, content_type="audio/webm;codecs=opus")
        assert res.provider == "sarvam"
        assert lang in res.text

    # Test unsupported languages (Kokborok, Mizo, Khasi return empty transcript without crash)
    for lang in ["trp-IN", "lus-IN", "kha-IN"]:
        res = await router.transcribe(sample_audio, language=lang, content_type="audio/webm;codecs=opus")
        assert res.provider == "unsupported"
        assert res.text == ""

    # Unsupported language
    res_unsupported = await router.transcribe(sample_audio, language="de")
    assert res_unsupported.provider == "unsupported"
    assert res_unsupported.text == ""


# =============================================================================
# 2. TTS Router Unit Tests (Indic Parler-TTS)
# =============================================================================
def test_tts_router_provider_routing():
    router = TTSRouter()
    # Indic Parler-TTS for supported languages
    assert router.get_provider_for_language("as") == "indic_parler"
    assert router.get_provider_for_language("brx") == "indic_parler"
    assert router.get_provider_for_language("mni") == "indic_parler"
    assert router.get_provider_for_language("hi") == "indic_parler"
    assert router.get_provider_for_language("hi-IN") == "indic_parler"
    assert router.get_provider_for_language("en") == "indic_parler"
    assert router.get_provider_for_language("en-IN") == "indic_parler"

    # Unsupported voice languages (Bhashini removed from active TTS routing)
    assert router.get_provider_for_language("kokborok") == "unsupported"
    assert router.get_provider_for_language("trp") == "unsupported"
    assert router.get_provider_for_language("mizo") == "unsupported"
    assert router.get_provider_for_language("lus") == "unsupported"
    assert router.get_provider_for_language("kha") == "unsupported"
    assert router.get_provider_for_language("kha-IN") == "unsupported"
    assert router.get_provider_for_language("khasi") == "unsupported"


@pytest.mark.asyncio
async def test_tts_router_synthesize_all_8_languages():
    mock_indic_parler = IndicParlerTTSProvider(enabled=True)
    mock_indic_parler.synthesize = AsyncMock(side_effect=lambda text, language: TTSResult(
        audio_base64="MOCK_INDIC_PARLER_AUDIO_B64",
        language=language,
        available=True,
        status="AVAILABLE",
    ))
    mock_sarvam = SarvamProvider(api_key="mock_key_12345")

    router = TTSRouter(indic_parler_provider=mock_indic_parler, sarvam_provider=mock_sarvam)

    # Indic Parler-TTS supported languages (Assamese, Bodo, Manipuri, Hindi, English)
    for lang in ["as-IN", "brx-IN", "mni-IN", "hi-IN", "en-IN"]:
        res = await router.synthesize("টেস্ট", language=lang)
        assert res.available is True
        assert res.audio_base64 == "MOCK_INDIC_PARLER_AUDIO_B64"

    # Unsupported voice languages (Kokborok, Mizo, Khasi) -> honest UNAVAILABLE status
    for lang in ["trp-IN", "lus-IN", "kha-IN"]:
        res_reg = await router.synthesize("টেস্ট", language=lang)
        assert res_reg.available is False
        assert res_reg.status == "UNAVAILABLE"
        assert res_reg.audio_base64 is None


@pytest.mark.asyncio
async def test_tts_router_strict_no_silent_fallback_when_unconfigured():
    # Router with unconfigured providers
    unconfigured_indic = IndicParlerTTSProvider(enabled=False)
    unconfigured_sarvam = SarvamProvider(api_key=None)
    router = TTSRouter(indic_parler_provider=unconfigured_indic, sarvam_provider=unconfigured_sarvam)

    # Assamese
    res_as = await router.synthesize("নমস্কাৰ", language="as")
    assert res_as.available is False
    assert res_as.status in ["UNAVAILABLE", "IN_DEVELOPMENT"]
    assert "Assamese" in res_as.message
    assert res_as.audio_base64 is None

    # Mizo
    res_mizo = await router.synthesize("Chibai", language="mizo")
    assert res_mizo.available is False
    assert res_mizo.status in ["UNAVAILABLE", "IN_DEVELOPMENT"]
    assert "Mizo" in res_mizo.message
    assert res_mizo.audio_base64 is None

    # Kokborok
    res_kok = await router.synthesize("खुलुमबाय", language="kokborok")
    assert res_kok.available is False
    assert res_kok.status in ["UNAVAILABLE", "IN_DEVELOPMENT"]
    assert "Kokborok" in res_kok.message

    # Khasi
    res_kha = await router.synthesize("Khublei", language="khasi")
    assert res_kha.available is False
    assert res_kha.status in ["UNAVAILABLE", "IN_DEVELOPMENT"]
    assert "Khasi" in res_kha.message
    assert res_kha.audio_base64 is None


# =============================================================================
# 3. Voice Gateway Integration Pipeline Tests (POST /api/v1/voice/process)
# =============================================================================
def test_voice_process_transcript_without_audio_all_8_languages(
    client: TestClient,
    seed_test_data,
    patient_auth_headers,
):
    headers = patient_auth_headers
    patient_id = seed_test_data["patient"].id

    test_cases = [
        ("as", "নমস্কাৰ সহায়ক", "মেম'গ্ৰাম"),
        ("hi", "नमस्ते सहायक", "मेमोग्राम"),
        ("brx", "खुलुमबाय हेफाजाबगिरि", "मेमोग्राम"),
        ("mni", "খুরুমজরি মরুপ", "মেমোগ্রাম"),
        ("trp", "खुलुमबाय मददगिरि", "मेमोग्राम"),
        ("lus", "Chibai puihtu", "Memogram"),
        ("kha", "Khublei nongiarap", "Memogram"),
        ("en", "Hello Memogram assistant", "Memogram"),
    ]

    for lang, phrase, expected_word in test_cases:
        payload = {
            "patient_id": patient_id,
            "language": lang,
            "transcript_text": phrase,
        }
        res = client.post("/api/v1/voice/process", json=payload, headers=headers)
        assert res.status_code == 200, f"Failed for language {lang}: {res.text}"
        data = res.json()
        assert data["recognized_text"] == phrase
        assert expected_word in data["reply_text"]
        assert data["language"] == lang


def test_voice_process_audio_base64_with_content_type(
    client: TestClient,
    seed_test_data,
    patient_auth_headers,
):
    headers = patient_auth_headers
    patient_id = seed_test_data["patient"].id

    sample_audio_b64 = base64.b64encode(b"SIMULATED_RECORDED_AUDIO_WEBM_OPUS").decode("utf-8")

    mock_stt_res = STTResult(
        text="Can you show me the next game?",
        language="en",
        confidence=0.96,
        provider="sarvam",
    )

    with patch.object(STTRouter, "transcribe", new_callable=AsyncMock, return_value=mock_stt_res):
        payload = {
            "patient_id": patient_id,
            "language": "en",
            "audio_base64": sample_audio_b64,
            "audio_content_type": "audio/webm;codecs=opus",
        }
        res = client.post("/api/v1/voice/process", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["recognized_text"] == "Can you show me the next game?"
        assert data["intent"] == "NEXT_GAME"
        assert data["tool_executed"] == "get_next_recommended_game"
        assert data["data"] is not None


def test_voice_process_invalid_audio_graceful_handling(
    client: TestClient,
    seed_test_data,
    patient_auth_headers,
):
    headers = patient_auth_headers
    patient_id = seed_test_data["patient"].id

    payload = {
        "patient_id": patient_id,
        "language": "hi",
        "audio_base64": "NOT_VALID_BASE64_!!!",
    }
    res = client.post("/api/v1/voice/process", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "आवाज़" in data["reply_text"] or "स्पष्ट" in data["reply_text"]


def test_voice_process_tool_queries_across_languages(
    client: TestClient,
    seed_test_data,
    patient_auth_headers,
    db,
):
    from datetime import date
    from app.models.medication import Medication

    patient = seed_test_data["patient"]
    headers = patient_auth_headers
    patient_id = patient.id

    # Ensure Donepezil medication exists
    med = db.query(Medication).filter(Medication.patient_id == patient_id).first()
    if not med:
        med = Medication(
            patient_id=patient_id,
            name="Donepezil",
            dosage="5mg",
            time_of_day="08:00 Morning",
            frequency="daily",
            start_date=date(2025, 1, 1),
            instructions="Take 1 tablet with water",
            is_active=True,
        )
        db.add(med)
        db.commit()

    # 1. Medication query (Assamese)
    res_med = client.post("/api/v1/voice/process", json={
        "patient_id": patient_id,
        "language": "as",
        "transcript_text": "মই ঔষধ কেতিয়া খাব লাগিব?",
    }, headers=headers)
    assert res_med.status_code == 200
    assert res_med.json()["intent"] == "MEDICATION_SCHEDULE"
    assert "Donepezil" in res_med.json()["reply_text"]

    # 2. Next game query (Bodo)
    res_game = client.post("/api/v1/voice/process", json={
        "patient_id": patient_id,
        "language": "brx",
        "transcript_text": "दिनै आं मा गेलेनाय गेलेनो?",
    }, headers=headers)
    assert res_game.status_code == 200
    assert res_game.json()["intent"] == "NEXT_GAME"

    # 3. Reminder query (Manipuri)
    res_rem = client.post("/api/v1/voice/process", json={
        "patient_id": patient_id,
        "language": "mni",
        "transcript_text": "ঙসিগী নীংশিংবা করি লৈরি?",
    }, headers=headers)
    assert res_rem.status_code == 200
    assert res_rem.json()["intent"] == "UPCOMING_REMINDERS"

    # 4. Emergency SOS query (Kokborok)
    res_sos = client.post("/api/v1/voice/process", json={
        "patient_id": patient_id,
        "language": "kokborok",
        "transcript_text": "मदद खालाम emergency sos",
    }, headers=headers)
    assert res_sos.status_code == 200
    assert res_sos.json()["intent"] == "SOS_TRIGGER"

    # 5. Progress query (Mizo)
    res_prog = client.post("/api/v1/voice/process", json={
        "patient_id": patient_id,
        "language": "mizo",
        "transcript_text": "Ka progress report engtin nge?",
    }, headers=headers)
    assert res_prog.status_code == 200
    assert res_prog.json()["intent"] == "PATIENT_PROGRESS"


# =============================================================================
# 4. Languages Registry API Verification
# =============================================================================
def test_languages_endpoint_exact_8_languages(client: TestClient):
    res = client.get("/api/v1/languages")
    assert res.status_code == 200
    langs = res.json()
    assert len(langs) == 8

    codes = [l["language_code"] for l in langs]
    expected_codes = ["as", "brx", "mni", "kokborok", "mizo", "kha", "hi", "en"]
    for ec in expected_codes:
        assert ec in codes, f"Expected {ec} in language registry"

    # Verify no disallowed languages present
    assert "bn" not in codes
    assert "te" not in codes
    assert "ta" not in codes

    # Verify Khasi capability specifics (speech provider in development, Bhashini removed)
    kha_lang = next(l for l in langs if l["language_code"] == "kha")
    assert kha_lang["display_name"] == "Khasi"
    assert kha_lang["status"] == "IN_DEVELOPMENT"
    assert kha_lang["capabilities"]["stt"]["provider"] == "none"
    assert kha_lang["capabilities"]["tts"]["provider"] == "none"

    # Verify Assamese capability specifics (Sarvam Saaras v3 STT & Indic Parler-TTS)
    as_lang = next(l for l in langs if l["language_code"] == "as")
    assert as_lang["display_name"] == "Assamese"
    assert as_lang["capabilities"]["stt"]["provider"] == "sarvam"
    assert as_lang["capabilities"]["tts"]["provider"] == "indic_parler"

    # Verify each has stt, tts, translation detail
    for l in langs:
        assert "capabilities" in l
        assert "stt" in l["capabilities"]
        assert "tts" in l["capabilities"]
        assert "translation" in l["capabilities"]
        assert l["text_available"] is True
