"""Whisper transcription for teacher audio with FR/AR NLP enhancements.

Uses faster-whisper with large-v3-turbo for:
- Better accuracy with Arabic dialects (Tunisian, Moroccan, etc.)
- GPU acceleration with CUDA (auto-falls back to CPU if unavailable)
- 4x faster than openai-whisper
"""

import os
import re
import json
from collections import Counter
from typing import Dict, List, Optional, Any

import torch
# Use faster-whisper for GPU acceleration and large-v3-turbo support
from faster_whisper import WhisperModel

# ── Detect CUDA availability once at import time ────────
_CUDA_AVAILABLE = torch.cuda.is_available()
if _CUDA_AVAILABLE:
    print("🟢 CUDA detected — Whisper will use GPU")
else:
    print("🟡 CUDA not available — Whisper will run on CPU (no GPU required)")

# Cached Whisper models
_whisper_models: Dict[str, WhisperModel] = {}
_whisper_device_labels: Dict[str, str] = {}
_default_model_size = "large-v3-turbo"


def get_whisper_model(model_size: str = "large-v3-turbo") -> WhisperModel:
    """
    Get cached Whisper model, loading if necessary.
    Automatically uses GPU (CUDA) if available, otherwise CPU.
    
    Model options:
    - "large-v3-turbo" - Best for dialects, fastest large model (RECOMMENDED)
    - "large-v3" - Most accurate, slower
    - "large-v2" - Very accurate
    - "medium" - Good balance
    - "small" - Fast but less accurate
    - "base" - Very fast, least accurate
    """
    global _whisper_models, _whisper_device_labels
    if model_size not in _whisper_models:
        if _CUDA_AVAILABLE:
            # ── GPU path ─────────────────────────────────
            print(f"🔄 Loading Faster-Whisper model ({model_size}) on GPU...")
            compute_type = "float16"
            try:
                _whisper_models[model_size] = WhisperModel(
                    model_size,
                    device="cuda",
                    compute_type=compute_type,
                    download_root=os.path.join(os.path.dirname(__file__), "..", "models"),
                )
                print(f"✅ Faster-Whisper {model_size} loaded on CUDA (GPU)")
            except Exception as e:
                print(f"⚠️ GPU loading failed: {e}")
                print(f"🔄 Falling back to CPU...")
                _whisper_models[model_size] = WhisperModel(
                    model_size,
                    device="cpu",
                    compute_type="int8",
                    download_root=os.path.join(os.path.dirname(__file__), "..", "models"),
                )
                print(f"✅ Faster-Whisper {model_size} loaded on CPU (fallback)")
        else:
            # ── CPU path (no CUDA installed) ─────────────
            print(f"🔄 Loading Faster-Whisper model ({model_size}) on CPU...")
            _whisper_models[model_size] = WhisperModel(
                model_size,
                device="cpu",
                compute_type="int8",  # Fastest on CPU
                download_root=os.path.join(os.path.dirname(__file__), "..", "models"),
            )
            print(f"✅ Faster-Whisper {model_size} loaded on CPU")
    
    return _whisper_models[model_size]


def preload_whisper_model(model_size: str = "large-v3-turbo"):
    """Preload Whisper model at startup."""
    global _default_model_size
    _default_model_size = model_size
    expected_device_label = "GPU (CUDA)" if _CUDA_AVAILABLE else "CPU"
    print("=" * 50)
    print(f"🚀 PRELOADING FASTER-WHISPER ({model_size}) on {expected_device_label}...")
    print("=" * 50)
    get_whisper_model(model_size)
    print("=" * 50)
    print(f"✅ WHISPER MODEL READY ({expected_device_label})")
    print("=" * 50)


def is_whisper_loaded(model_size: str = "large-v3-turbo") -> bool:
    """Check if Whisper model is already loaded."""
    return model_size in _whisper_models


def get_whisper_device_label(model_size: str = "large-v3-turbo") -> str:
    """Get the runtime device label for a loaded Whisper model."""
    model = _whisper_models.get(model_size)
    if model is not None:
        device = str(getattr(model.model, "device", "")).lower()
        if device == "cuda":
            return "GPU (CUDA)"
        if device == "cpu":
            return "CPU"
    return "GPU (CUDA)" if _CUDA_AVAILABLE else "CPU"


def _preload_whisper_model_legacy(model_size: str = "large-v3-turbo"):
    """Preload Whisper model at startup using the actual runtime device label."""
    global _default_model_size
    _default_model_size = model_size
    expected_device_label = "GPU (CUDA)" if _CUDA_AVAILABLE else "CPU"
    print("=" * 50)
    print(f"PRELOADING FASTER-WHISPER ({model_size}) on {expected_device_label}...")
    print("=" * 50)
    get_whisper_model(model_size)
    actual_device_label = get_whisper_device_label(model_size)
    print("=" * 50)
    print(f"WHISPER MODEL READY ({actual_device_label})")
    print("=" * 50)


# ─────────────────────────────────────────────────────
# Tunisian Arabic / Maghrebi dialect improvements
# ─────────────────────────────────────────────────────
DIALECT_PROMPTS: Dict[str, str] = {
    # Tunisian Arabic (Derja)
    "ar_tn": (
        "محاضرة تعليمية باللهجة التونسية. الأستاذ يشرح الدرس بالدارجة التونسية. "
        "كلمات تونسية شائعة: برشا، توا، فيسع، باهي، ياخي، كيفاش، علاش، شنوة، "
        "ما نجمش، نحب، نفهم، نعرف، خدمة، قراية، امتحان، فرض. "
        "المعلم يستخدم اللهجة التونسية في الشرح."
    ),
    # Moroccan Arabic (Darija)
    "ar_ma": (
        "محاضرة تعليمية باللهجة المغربية. الأستاذ يشرح الدرس بالدارجة المغربية. "
        "كلمات مغربية شائعة: واخا، بزاف، دابا، شحال، فين، علاش، كيفاش، "
        "ما قدرتش، بغيت، فهمت، عرفت. المعلم يستخدم اللهجة المغربية."
    ),
    # Algerian Arabic
    "ar_dz": (
        "محاضرة تعليمية باللهجة الجزائرية. الأستاذ يشرح الدرس بالدارجة الجزائرية. "
        "كلمات جزائرية شائعة: واش، كيفاش، علاه، بزاف، راني، نقدر، نحوس. "
        "المعلم يستخدم اللهجة الجزائرية في الشرح."
    ),
}

# ─────────────────────────────────────────────────────
# FR / AR confusion keyword list
# Common words that Whisper mishears in classroom French and Arabic
# ─────────────────────────────────────────────────────
CONFUSION_KEYWORDS: Dict[str, List[Dict[str, str]]] = {
    "fr": [
        {"wrong": "je comprends pas", "correct": "je ne comprends pas", "context": "negation"},
        {"wrong": "répétez", "correct": "répétez", "context": "request_repeat"},
        {"wrong": "j'ai pas compris", "correct": "je n'ai pas compris", "context": "negation"},
        {"wrong": "c'est quoi", "correct": "qu'est-ce que c'est", "context": "question"},
        {"wrong": "on peut pas", "correct": "on ne peut pas", "context": "negation"},
        {"wrong": "y'a pas", "correct": "il n'y a pas", "context": "negation"},
        {"wrong": "chais pas", "correct": "je ne sais pas", "context": "negation"},
        {"wrong": "faut que", "correct": "il faut que", "context": "obligation"},
        {"wrong": "est-ce que c'est", "correct": "est-ce que c'est", "context": "question"},
        {"wrong": "comment on fait", "correct": "comment fait-on", "context": "question"},
    ],
    "ar": [
        {"wrong": "ما فهمتش", "correct": "لم أفهم", "context": "negation"},
        {"wrong": "عاود", "correct": "أعد من فضلك", "context": "request_repeat"},
        {"wrong": "ما عرفتش", "correct": "لا أعرف", "context": "negation"},
        {"wrong": "كيفاش", "correct": "كيف", "context": "question"},
        {"wrong": "واش", "correct": "هل", "context": "question"},
        {"wrong": "بزاف", "correct": "كثيرا", "context": "quantity"},
        {"wrong": "ما قدرتش", "correct": "لم أستطع", "context": "negation"},
        {"wrong": "شنو", "correct": "ماذا", "context": "question"},
        {"wrong": "علاش", "correct": "لماذا", "context": "question"},
        {"wrong": "ما كاينش", "correct": "لا يوجد", "context": "negation"},
    ],
}

# Initial prompts to improve Whisper accuracy for educational content
INITIAL_PROMPTS: Dict[str, str] = {
    "fr": (
        "Transcription d'un cours en français. Le professeur enseigne une leçon. "
        "Vocabulaire: exercice, examen, devoir, corrigé, chapitre, théorème, "
        "équation, hypothèse, démonstration, résultat, calcul, formule, "
        "questions, réponses, compréhension, explication, objectif, évaluation."
    ),
    "ar": (
        # Use Tunisian dialect prompt for better recognition
        "محاضرة تعليمية. الأستاذ يشرح الدرس. قد يستخدم اللهجة التونسية أو العربية الفصحى. "
        "كلمات شائعة: برشا، توا، باهي، كيفاش، علاش، شنوة، تمرين، امتحان، واجب، "
        "تصحيح، فصل، نظرية، معادلة، فرضية، برهان، نتيجة، حساب، صيغة، "
        "أسئلة، أجوبة، فهم، شرح، هدف، تقييم. نفهموا؟ فهمتوا؟ أي سؤال؟"
    ),
    "en": (
        "Transcription of a classroom lecture. The teacher is delivering a lesson. "
        "Vocabulary: exercise, exam, homework, correction, chapter, theorem, "
        "equation, hypothesis, proof, result, calculation, formula."
    ),
}

# Question markers per language for density detection
QUESTION_MARKERS: Dict[str, List[str]] = {
    "fr": [
        "est-ce que", "qu'est-ce", "pourquoi", "comment", "combien",
        "quand", "où", "qui", "quel", "quelle", "quels", "quelles",
        "n'est-ce pas", "?",
    ],
    "ar": [
        "هل", "ما", "ماذا", "لماذا", "كيف", "متى", "أين", "من",
        "كم", "أي", "؟",
    ],
    "en": [
        "what", "why", "how", "when", "where", "who", "which",
        "do you", "does", "did", "can you", "could you", "is it",
        "are there", "have you", "?",
    ],
}


def _detect_confusion_keywords(text: str, language: str) -> List[Dict[str, Any]]:
    """Find known confusion keywords in the transcript."""
    lang_key = language[:2].lower() if language else "en"
    keywords = CONFUSION_KEYWORDS.get(lang_key, [])
    found = []
    text_lower = text.lower()
    for kw in keywords:
        pattern = kw["wrong"].lower()
        count = text_lower.count(pattern)
        if count > 0:
            found.append({
                "keyword": kw["wrong"],
                "correct_form": kw["correct"],
                "context": kw["context"],
                "occurrences": count,
            })
    return found


def _count_question_density(segments: List[Dict], language: str) -> Dict[str, Any]:
    """Count questions per minute based on markers and punctuation."""
    lang_key = language[:2].lower() if language else "en"
    markers = QUESTION_MARKERS.get(lang_key, QUESTION_MARKERS["en"])

    total_questions = 0
    question_timestamps = []

    for seg in segments:
        seg_text = seg.get("text", "").lower()
        is_question = False
        for marker in markers:
            if marker in seg_text:
                is_question = True
                break
        if is_question:
            total_questions += 1
            question_timestamps.append({
                "time": round(seg.get("start", 0), 1),
                "text": seg.get("text", "").strip()[:80],
            })

    # Calculate duration in minutes
    if segments:
        total_duration_min = max(
            (seg.get("end", 0) for seg in segments), default=0
        ) / 60.0
    else:
        total_duration_min = 1.0

    density = round(total_questions / max(total_duration_min, 0.01), 2)

    return {
        "total_questions": total_questions,
        "duration_minutes": round(total_duration_min, 1),
        "questions_per_minute": density,
        "question_timestamps": question_timestamps[:20],  # cap at 20
    }


def _detect_word_repetitions(segments: List[Dict], language: str,
                              window_sec: float = 60.0,
                              min_repeats: int = 3) -> List[Dict[str, Any]]:
    """Detect words repeated >min_repeats times within a sliding window."""
    lang_key = language[:2].lower() if language else "en"

    # Common stop words to ignore
    stop_words = {
        "fr": {"le", "la", "les", "de", "du", "des", "un", "une", "et", "est",
               "en", "que", "qui", "à", "au", "aux", "ce", "se", "ne", "pas",
               "on", "il", "elle", "nous", "vous", "ils", "je", "tu", "son",
               "sa", "ses", "dans", "pour", "par", "sur", "avec", "mais", "ou"},
        "ar": {"في", "من", "على", "إلى", "هذا", "هذه", "ذلك", "التي", "الذي",
               "أن", "لا", "ما", "هو", "هي", "هم", "و", "ب", "ل", "ك"},
        "en": {"the", "a", "an", "is", "are", "was", "were", "be", "been",
               "being", "have", "has", "had", "do", "does", "did", "will",
               "would", "could", "should", "may", "might", "shall", "can",
               "to", "of", "in", "for", "on", "with", "at", "by", "from",
               "it", "this", "that", "i", "you", "he", "she", "we", "they",
               "and", "but", "or", "not", "so"},
    }
    stops = stop_words.get(lang_key, stop_words["en"])

    # Build timed word list
    timed_words = []
    for seg in segments:
        seg_text = seg.get("text", "")
        start_t = seg.get("start", 0)
        end_t = seg.get("end", start_t)
        # Simple word split (works for most languages)
        words = re.findall(r'\b\w+\b', seg_text.lower()) if lang_key != "ar" else seg_text.split()
        if not words:
            continue
        word_dur = (end_t - start_t) / max(len(words), 1)
        for i, word in enumerate(words):
            if len(word) < 2 or word in stops:
                continue
            timed_words.append({
                "word": word,
                "time": round(start_t + i * word_dur, 2),
            })

    # Sliding window detection
    repetitions = []
    seen_words = set()
    for i, tw in enumerate(timed_words):
        window_start = tw["time"]
        window_end = window_start + window_sec
        # Count occurrences in window
        window_words = [
            w for w in timed_words
            if window_start <= w["time"] <= window_end and w["word"] == tw["word"]
        ]
        count = len(window_words)
        if count >= min_repeats and tw["word"] not in seen_words:
            seen_words.add(tw["word"])
            repetitions.append({
                "word": tw["word"],
                "count_in_window": count,
                "window_start": round(window_start, 1),
                "window_end": round(window_end, 1),
            })

    return sorted(repetitions, key=lambda x: -x["count_in_window"])[:15]


def transcribe_teacher_audio(
    teacher_wav_path: str,
    model_size: str = "large-v3-turbo",
    language: str = None,
    dialect: str = None,  # "tn" for Tunisian, "ma" for Moroccan, "dz" for Algerian
    out_json_path: str = None,
    out_words_json_path: str = None,
) -> dict:
    """
    Transcribe teacher-only audio with Faster-Whisper (large-v3-turbo on GPU).

    Parameters
    ----------
    teacher_wav_path : str   - path to the teacher-only WAV
    model_size       : str   - 'large-v3-turbo' (recommended), 'large-v3', 'medium', 'small'
    language         : str   - ISO code or None for auto-detect
    dialect          : str   - Optional dialect hint: 'tn' (Tunisian), 'ma' (Moroccan), 'dz' (Algerian)
    out_json_path    : str   - optional path to save raw Whisper JSON
    out_words_json_path : str - optional path to save extracted word-level JSON

    Returns
    -------
    dict  - Whisper result with keys:
            'text', 'segments', 'language',
            'transcription_meta' (model, word_count, confusion_keywords,
             question_density, word_repetitions)
    """
    if teacher_wav_path is None or not os.path.exists(teacher_wav_path):
        raise FileNotFoundError(f"Teacher audio not found: {teacher_wav_path}")

    model = get_whisper_model(model_size)
    print(f"🎙️ Transcribing {teacher_wav_path} with {model_size}...")

    # Build transcription options
    transcribe_options = {
        "word_timestamps": True,
        "vad_filter": True,  # Voice Activity Detection - removes silence
        "vad_parameters": {
            "min_silence_duration_ms": 500,
        },
    }

    # Determine initial prompt based on language/dialect
    initial_prompt = None
    auto_detect_mode = language is None and dialect is None
    
    if dialect:
        # Use dialect-specific prompt for better recognition
        dialect_key = f"ar_{dialect}"
        if dialect_key in DIALECT_PROMPTS:
            initial_prompt = DIALECT_PROMPTS[dialect_key]
            print(f"🗣️ Using {dialect.upper()} dialect prompt for better accuracy")
            language = "ar"  # Force Arabic when dialect is specified
    
    if language:
        transcribe_options["language"] = language
        if not initial_prompt:
            lang_key = language[:2].lower()
            if lang_key in INITIAL_PROMPTS:
                initial_prompt = INITIAL_PROMPTS[lang_key]
    
    if initial_prompt:
        transcribe_options["initial_prompt"] = initial_prompt

    # Run transcription with faster-whisper
    segments_gen, info = model.transcribe(teacher_wav_path, **transcribe_options)
    
    # Auto-detect mode: if Arabic detected, re-run with Tunisian dialect for better accuracy
    if auto_detect_mode and info.language == "ar":
        print(f"🔍 Auto-detected Arabic (probability: {info.language_probability:.2f})")
        print(f"🗣️ Re-running with Tunisian dialect prompt for better accuracy...")
        
        # Re-run with Tunisian dialect prompt
        transcribe_options["language"] = "ar"
        transcribe_options["initial_prompt"] = DIALECT_PROMPTS["ar_tn"]
        segments_gen, info = model.transcribe(teacher_wav_path, **transcribe_options)
    
    # Convert generator to list and build result
    segments = []
    full_text_parts = []
    
    for segment in segments_gen:
        seg_dict = {
            "id": len(segments),
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip(),
        }
        
        # Add word-level timestamps if available
        if segment.words:
            seg_dict["words"] = [
                {
                    "word": w.word,
                    "start": w.start,
                    "end": w.end,
                    "probability": w.probability,
                }
                for w in segment.words
            ]
        
        segments.append(seg_dict)
        full_text_parts.append(segment.text.strip())
    
    transcript_text = " ".join(full_text_parts)
    detected_lang = info.language

    words_extract = []
    for seg in segments:
        seg_id = seg.get("id")
        for w in seg.get("words", []):
            words_extract.append({
                "segmentId": seg_id,
                "word": w.get("word", "").strip(),
                "start": w.get("start"),
                "end": w.get("end"),
                "probability": w.get("probability"),
            })
    
    print(f"✅ Transcription complete!")
    print(f"   Language: {detected_lang} (probability: {info.language_probability:.2f})")
    print(f"   Duration: {info.duration:.1f}s")
    print(f"   Segments: {len(segments)}")
    print(f"   Characters: {len(transcript_text)}")
    print(f"   Words: {len(transcript_text.split())}")
    print(f"   Whisper word timestamps: {len(words_extract)}")

    # Build result dict (compatible with old format)
    result = {
        "text": transcript_text,
        "segments": segments,
        "word_extract": {
            "totalWords": len(words_extract),
            "words": words_extract,
        },
        "language": detected_lang,
        "language_probability": info.language_probability,
        "duration": info.duration,
    }

    # ── NLP Post-Processing ──────────────────────────
    word_count = len(transcript_text.split())

    # 1. Confusion keyword detection
    confusion = _detect_confusion_keywords(transcript_text, detected_lang)
    if confusion:
        print(f"   Confusion keywords found: {len(confusion)}")

    # 2. Question density counter
    question_density = _count_question_density(segments, detected_lang)
    print(f"   Questions detected: {question_density['total_questions']} "
          f"({question_density['questions_per_minute']}/min)")

    # 3. Word repetition detector
    word_repetitions = _detect_word_repetitions(segments, detected_lang)
    if word_repetitions:
        print(f"   Word repetitions (>3x/60s): {len(word_repetitions)}")

    # Attach transcription metadata to result
    result["transcription_meta"] = {
        "model_used": model_size,
        "language": detected_lang,
        "language_probability": info.language_probability,
        "dialect": dialect,
        "word_count": word_count,
        "word_timestamps_count": len(words_extract),
        "duration_seconds": info.duration,
        "confusion_keywords": confusion,
        "question_density": question_density,
        "word_repetitions": word_repetitions,
    }

    if out_json_path:
        with open(out_json_path, "w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=2, ensure_ascii=False)
        print(f"   Raw transcript JSON -> {out_json_path}")

    if out_words_json_path:
        words_payload = {
            "language": detected_lang,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "totalWords": len(words_extract),
            "words": words_extract,
        }
        with open(out_words_json_path, "w", encoding="utf-8") as fh:
            json.dump(words_payload, fh, indent=2, ensure_ascii=False)
        print(f"   Whisper words JSON -> {out_words_json_path}")

    return result
