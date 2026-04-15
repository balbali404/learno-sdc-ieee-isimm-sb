"""Lesson JSON generation with Gemini API for student dashboard."""

import os
import re
import json
import uuid
import time
from datetime import datetime
from typing import Optional, Dict, Any, List

from .config import GEMINI_JSON_MAX_RETRIES, GEMINI_REQUEST_TIMEOUT_SEC, GEMINI_MODELS_TO_TRY
from .prompts import build_lesson_json_prompt
from .lesson_pdf import call_gemini_api


def _fix_json_string(json_str: str) -> str:
    """Try to fix common JSON errors from LLM responses."""
    # Remove trailing commas before } or ]
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    # Remove any control characters except newlines and tabs
    json_str = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', json_str)
    
    # Fix unescaped quotes inside strings (very common LLM error)
    # This is complex - we need to properly escape quotes that appear inside JSON string values
    
    return json_str


def _robust_json_parse(json_str: str) -> dict:
    """
    Robustly parse JSON that may have formatting issues.
    Uses multiple strategies to extract valid JSON.
    """
    # Strategy 1: Direct parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Fix common issues
    fixed = _fix_json_string(json_str)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    
    # Strategy 3: Try to parse line by line and rebuild
    # This handles cases where there are issues in the middle
    try:
        # Remove all newlines and extra whitespace, then re-parse
        compact = re.sub(r'\s+', ' ', json_str)
        return json.loads(compact)
    except json.JSONDecodeError:
        pass
    
    # Strategy 4: Use ast.literal_eval as fallback (works for some cases)
    try:
        import ast
        # Convert JSON-style to Python-style
        py_str = json_str.replace('null', 'None').replace('true', 'True').replace('false', 'False')
        result = ast.literal_eval(py_str)
        return result
    except:
        pass
    
    # Strategy 5: Extract and rebuild JSON structure manually
    # Find all key-value pairs and reconstruct
    try:
        result = _extract_json_manually(json_str)
        if result:
            return result
    except:
        pass
    
    raise ValueError(f"Could not parse JSON after all strategies")


def _extract_json_manually(json_str: str) -> dict:
    """
    Manually extract JSON structure by finding key patterns.
    This is a last-resort fallback for badly formatted JSON.
    """
    result = {}
    
    # Extract simple string fields
    simple_fields = [
        "title", "subject", "subjectColor", "description", "difficulty", 
        "ageGroup", "language"
    ]
    for field in simple_fields:
        match = re.search(rf'"{field}"\s*:\s*"([^"]*)"', json_str)
        if match:
            result[field] = match.group(1)
    
    # Extract number fields
    number_fields = ["gradeLevel", "totalDurationMin", "totalXP"]
    for field in number_fields:
        match = re.search(rf'"{field}"\s*:\s*(\d+)', json_str)
        if match:
            result[field] = int(match.group(1))
    
    # Extract chapters array - this is the tricky part
    chapters_match = re.search(r'"chapters"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*"(?:keyVocabulary|learningObjectives))', json_str)
    if chapters_match:
        chapters_str = chapters_match.group(1)
        chapters = []
        
        # Find each chapter object
        chapter_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        for ch_match in re.finditer(chapter_pattern, chapters_str):
            ch_str = ch_match.group(0)
            try:
                ch = json.loads(ch_str)
                chapters.append(ch)
            except:
                # Try to extract chapter fields manually
                ch = {}
                for f in ["title", "content", "summary", "keyInsight"]:
                    m = re.search(rf'"{f}"\s*:\s*"((?:[^"\\]|\\.)*)"', ch_str)
                    if m:
                        ch[f] = m.group(1)
                for f in ["chapterNumber", "durationMin", "readingTimeSec", "xpReward"]:
                    m = re.search(rf'"{f}"\s*:\s*(\d+)', ch_str)
                    if m:
                        ch[f] = int(m.group(1))
                # Extract keyPoints array
                kp_match = re.search(r'"keyPoints"\s*:\s*\[(.*?)\]', ch_str)
                if kp_match:
                    kp_str = kp_match.group(1)
                    ch["keyPoints"] = re.findall(r'"([^"]*)"', kp_str)
                
                if ch:
                    chapters.append(ch)
        
        result["chapters"] = chapters
    
    # Extract learningObjectives array
    lo_match = re.search(r'"learningObjectives"\s*:\s*\[(.*?)\]', json_str, re.DOTALL)
    if lo_match:
        lo_str = lo_match.group(1)
        result["learningObjectives"] = re.findall(r'"([^"]*)"', lo_str)
    
    # Extract keyVocabulary array
    kv_match = re.search(r'"keyVocabulary"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*"learningObjectives|\s*\})', json_str)
    if kv_match:
        kv_str = kv_match.group(1)
        vocab = []
        # Try to find term/definition pairs
        for v_match in re.finditer(r'\{\s*"term"\s*:\s*"([^"]*)"\s*,\s*"definition"\s*:\s*"([^"]*)"\s*\}', kv_str):
            vocab.append({"term": v_match.group(1), "definition": v_match.group(2)})
        result["keyVocabulary"] = vocab
    
    if result and "title" in result:
        return result
    return None


def _extract_json_from_response(text: str) -> dict:
    """Extract JSON object from Gemini response, handling potential markdown wrapping."""
    # Try to find JSON block in markdown code fence
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find raw JSON (starts with { and ends with })
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            json_str = json_match.group(0)
        else:
            raise ValueError("No JSON found in Gemini response")
    
    # Use robust parser
    try:
        return _robust_json_parse(json_str)
    except Exception as e:
        print(f"⚠️ All JSON parsing strategies failed")
        print(f"   First 1000 chars: {json_str[:1000]}")
        raise ValueError(f"Failed to parse JSON: {e}\nFirst 500 chars: {json_str[:500]}")


def _generate_chapter_id() -> str:
    """Generate a unique chapter ID."""
    return f"ch_{uuid.uuid4().hex[:8]}"


def _calculate_reading_time(content: str) -> int:
    """Calculate estimated reading time in seconds (avg 200 words/min)."""
    word_count = len(content.split())
    return max(30, int(word_count / 200 * 60))


def generate_lesson_json(
    whisper_result: dict,
    audio_file: str,
    session_id: str = None,
    teacher_id: str = None,
    class_id: str = None,
    subject_id: str = None,
    grade_level: int = 10,
    age: int = None,
    out_json_path: str = None,
) -> Dict[str, Any]:
    """
    Generate structured lesson JSON from Whisper transcription using Gemini.
    
    Parameters
    ----------
    whisper_result : dict - Whisper transcription result with 'text' and 'segments'
    audio_file : str - Path to the original audio file
    session_id : str - Optional session ID from the recording session
    teacher_id : str - Optional teacher ID
    class_id : str - Optional class ID
    subject_id : str - Optional subject ID
    grade_level : int - Student grade level (default: 10)
    age : int - Student age (optional)
    out_json_path : str - Optional path to save the JSON file
    
    Returns
    -------
    dict - Structured lesson data matching the Prisma Lesson/Chapter models
    """
    total_started_at = time.time()

    # Build the prompt
    system_prompt, user_prompt, session_name, detected_lang = build_lesson_json_prompt(
        whisper_result, audio_file, grade_level, age
    )
    
    print(f"Calling Gemini API to generate lesson JSON (grade {grade_level})...")
    
    # Retry configurable number of times if Gemini doesn't return valid JSON
    max_retries = max(1, GEMINI_JSON_MAX_RETRIES)
    last_error = None
    lesson_data = None
    print(
        f"Gemini JSON retries: {max_retries} (request read timeout: {GEMINI_REQUEST_TIMEOUT_SEC}s)"
    )

    def _is_overload_error(exc: Exception) -> bool:
        message = str(exc).lower()
        return (
            "503" in message
            or "unavailable" in message
            or "high demand" in message
            or "overloaded" in message
        )

    models_to_try = GEMINI_MODELS_TO_TRY or ["gemini-2.5-flash"]
    print(f"Gemini model order: {', '.join(models_to_try)}")

    for model_index, model_name in enumerate(models_to_try, start=1):
        print(f"  → Trying Gemini model {model_index}/{len(models_to_try)}: {model_name}")
        for attempt in range(1, max_retries + 1):
            response_text = ""
            try:
                if attempt == 1:
                    response_text = call_gemini_api(system_prompt, user_prompt, max_tokens=8192, model_name=model_name)
                else:
                    # On retry, add stronger JSON instruction
                    retry_prompt = user_prompt + (
                        "\n\n⚠️ IMPORTANT: Your previous response was NOT valid JSON. "
                        "You MUST respond with ONLY a raw JSON object starting with { and ending with }. "
                        "Do NOT wrap it in markdown code fences. Do NOT add any text before or after the JSON."
                    )
                    response_text = call_gemini_api(system_prompt, retry_prompt, max_tokens=8192, model_name=model_name)

                print(f"  Attempt {attempt}: Received {len(response_text)} characters from Gemini ({model_name})")

                # Log first/last chars for debugging
                if response_text:
                    print(f"  Response starts with: {repr(response_text[:80])}")
                    print(f"  Response ends with: {repr(response_text[-80:])}")

                parse_started_at = time.time()
                print("  → Parsing Gemini JSON response...")
                lesson_data = _extract_json_from_response(response_text)
                print(f"  ← JSON parsing finished in {time.time() - parse_started_at:.2f}s")
                print(f"  ✅ JSON parsed successfully on attempt {attempt} with {model_name}")
                break  # Success

            except Exception as e:
                last_error = e
                print(f"  ⚠️ Attempt {attempt}/{max_retries} failed on {model_name} ({type(e).__name__}): {e}")

                if _is_overload_error(e) and model_index < len(models_to_try):
                    print(f"  🔁 Gemini overload detected, switching to next model after a short pause...")
                    time.sleep(min(3.0, 1.0 + attempt))
                    break

                if attempt < max_retries:
                    backoff = min(6.0, 1.5 ** (attempt - 1))
                    print(f"  🔄 Retrying in {backoff:.1f}s...")
                    time.sleep(backoff)
                else:
                    print(f"  ❌ Model {model_name} exhausted {max_retries} attempts")
                    if response_text:
                        print(f"  Raw response (first 1000 chars):\n{response_text[:1000]}")
        
        if lesson_data is not None:
            break

    if lesson_data is None:
        raise RuntimeError(
            f"Failed to generate lesson JSON from Gemini after trying models: {', '.join(models_to_try)}. Last error: {last_error}"
        )
    
    # Generate lesson ID
    lesson_id = f"lesson_{uuid.uuid4().hex[:12]}"
    
    # Process and validate chapters
    chapters = []
    total_duration = 0
    total_xp = 0
    
    chapters_started_at = time.time()
    print("  → Transforming chapters and lesson structure...")
    for i, ch in enumerate(lesson_data.get("chapters", []), start=1):
        chapter_content = ch.get("content", "")
        reading_time = ch.get("readingTimeSec") or _calculate_reading_time(chapter_content)
        duration = ch.get("durationMin", 5)
        xp = ch.get("xpReward", 30)
        
        chapter = {
            "chapterId": _generate_chapter_id(),
            "chapterNumber": i,
            "title": ch.get("title", f"Chapter {i}"),
            "content": chapter_content,
            "summary": ch.get("summary", ""),
            "durationMin": duration,
            "readingTimeSec": reading_time,
            "xpReward": xp,
            "keyInsight": ch.get("keyInsight", ""),
            "keyPoints": ch.get("keyPoints", []),
        }
        chapters.append(chapter)
        total_duration += duration
        total_xp += xp
    print(f"  ← Chapter transformation finished in {time.time() - chapters_started_at:.2f}s")
    
    # Build final lesson structure
    result = {
        # Identifiers
        "lessonId": lesson_id,
        "sessionId": session_id,
        "teacherId": teacher_id,
        "classId": class_id,
        "subjectId": subject_id,
        
        # Metadata
        "title": lesson_data.get("title", session_name),
        "subject": lesson_data.get("subject", "General"),
        "subjectColor": lesson_data.get("subjectColor", "#2DD4BF"),
        "description": lesson_data.get("description", ""),
        "difficulty": lesson_data.get("difficulty", "INTERMEDIATE"),
        "gradeLevel": grade_level,
        "ageGroup": lesson_data.get("ageGroup", f"{grade_level + 4}-{grade_level + 6}"),
        
        # Duration & XP
        "totalDurationMin": total_duration or lesson_data.get("totalDurationMin", 25),
        "totalXP": total_xp or lesson_data.get("totalXP", 100),
        
        # Stats (initialized)
        "rating": 0.0,
        "ratingCount": 0,
        "studentsEnrolled": 0,
        "completionRate": 0.0,
        
        # Content
        "chapters": chapters,
        "keyVocabulary": lesson_data.get("keyVocabulary", []),
        "learningObjectives": lesson_data.get("learningObjectives", []),
        
        # Language
        "language": detected_lang,
        
        # Timestamps
        "createdAt": datetime.utcnow().isoformat(),
    }
    
    # Save to file if path provided
    if out_json_path:
        save_started_at = time.time()
        print(f"  → Writing lesson JSON to disk: {out_json_path}")
        with open(out_json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"  ← Lesson JSON write finished in {time.time() - save_started_at:.2f}s")
        print(f"Lesson JSON saved -> {out_json_path}")

    print(f"✅ Lesson JSON pipeline complete in {time.time() - total_started_at:.2f}s")
    
    return result


def generate_lesson_pdf_and_json(
    whisper_result: dict,
    audio_file: str,
    output_dir: str,
    session_id: str = None,
    teacher_id: str = None,
    class_id: str = None,
    subject_id: str = None,
    grade_level: int = 10,
) -> Dict[str, Any]:
    """
    Generate both PDF and JSON for a lesson.
    
    Returns
    -------
    dict - Contains paths and lesson data:
        {
            "lessonPdfPath": "path/to/lesson.pdf",
            "lessonJsonPath": "path/to/lesson.json",
            "lessonData": {...}
        }
    """
    total_started_at = time.time()

    # Generate JSON first to get the AI-detected subject/title
    temp_json_path = os.path.join(output_dir, "temp_lesson.json")
    json_started_at = time.time()
    print("→ Starting lesson JSON generation stage...")
    lesson_data = generate_lesson_json(
        whisper_result=whisper_result,
        audio_file=audio_file,
        session_id=session_id,
        teacher_id=teacher_id,
        class_id=class_id,
        subject_id=subject_id,
        grade_level=grade_level,
        out_json_path=None,
    )
    print(f"← Lesson JSON generation stage finished in {time.time() - json_started_at:.2f}s")
    
    # Build filename from AI-detected subject and title
    subject_name = lesson_data.get("subject", "Lesson")
    lesson_title = lesson_data.get("title", "")
    date_str = datetime.now().strftime("%Y%m%d_%H%M")
    
    safe_subject = "".join(c if c.isalnum() or c in " -" else "" for c in subject_name).strip().replace(" ", "_")[:30]
    safe_title = "".join(c if c.isalnum() or c in " -" else "" for c in lesson_title).strip().replace(" ", "_")[:40]
    
    if safe_title and safe_title != safe_subject:
        base_name = f"{safe_subject}_{safe_title}_{date_str}"
    else:
        base_name = f"{safe_subject}_{date_str}"
    
    # Generate PDF FROM JSON data (same content as JSON)
    pdf_path = os.path.join(output_dir, f"{base_name}_Lesson.pdf")
    from .lesson_pdf import build_lesson_pdf_from_json
    pdf_started_at = time.time()
    print(f"→ Building lesson PDF: {pdf_path}")
    build_lesson_pdf_from_json(lesson_data, detected_lang=lesson_data.get("language", "en"), out_path=pdf_path)
    print(f"← Lesson PDF build finished in {time.time() - pdf_started_at:.2f}s")
    
    # Save JSON with descriptive name
    json_path = os.path.join(output_dir, f"{base_name}_Lesson.json")
    save_started_at = time.time()
    print(f"→ Saving lesson JSON: {json_path}")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lesson_data, f, indent=2, ensure_ascii=False)
    print(f"← Lesson JSON save finished in {time.time() - save_started_at:.2f}s")
    print(f"Lesson JSON saved -> {json_path}")
    
    lesson_data["pdfPath"] = pdf_path
    lesson_data["jsonPath"] = json_path
    lesson_data["status"] = "DRAFT"
    lesson_data["approvedAt"] = None
    
    return {
        "lessonPdfPath": pdf_path,
        "lessonJsonPath": json_path,
        "lessonData": lesson_data,
    }
