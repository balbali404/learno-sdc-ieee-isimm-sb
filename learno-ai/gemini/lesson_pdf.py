"""Lesson PDF generation with Gemini API."""

import os
import re
import time
import requests

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from .config import (
    GEMINI_MODEL,
    GEMINI_CONNECT_TIMEOUT_SEC,
    GEMINI_REQUEST_TIMEOUT_SEC,
    GEMINI_MODELS_TO_TRY,
    GEMINI_HTTP_MAX_RETRIES,
    GEMINI_HTTP_RETRY_BASE_DELAY_SEC,
    build_gemini_url,
)
from .prompts import build_lesson_prompt

# ── Arabic text support ──────────────────────────────────
import arabic_reshaper
from bidi.algorithm import get_display

# ── Register Arabic-supporting font (Arial from Windows) ─
_ARABIC_FONT_REGISTERED = False
_ARABIC_FONT_NAME = "Arial"

def _register_arabic_font():
    """Register an Arabic-supporting TTF font with ReportLab."""
    global _ARABIC_FONT_REGISTERED
    if _ARABIC_FONT_REGISTERED:
        return

    fonts_dir = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")

    # Try fonts in order of Arabic rendering quality
    font_candidates = [
        ("Arial", "arial.ttf", "arialbd.ttf"),
        ("Tahoma", "tahoma.ttf", "tahomabd.ttf"),
    ]

    for font_name, regular, bold in font_candidates:
        regular_path = os.path.join(fonts_dir, regular)
        bold_path = os.path.join(fonts_dir, bold)
        if os.path.exists(regular_path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, regular_path))
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont(f"{font_name}-Bold", bold_path))
                global _ARABIC_FONT_NAME
                _ARABIC_FONT_NAME = font_name
                _ARABIC_FONT_REGISTERED = True
                print(f"✅ Registered '{font_name}' font for Arabic PDF support")
                return
            except Exception as e:
                print(f"⚠️ Failed to register {font_name}: {e}")

    print("⚠️ No Arabic font found — Arabic text may not render correctly")


def _is_arabic(text: str) -> bool:
    """Check if text contains Arabic characters."""
    for ch in text:
        if '\u0600' <= ch <= '\u06FF' or '\u0750' <= ch <= '\u077F' or '\uFB50' <= ch <= '\uFDFF' or '\uFE70' <= ch <= '\uFEFF':
            return True
    return False


def _reshape_arabic(text: str) -> str:
    """Reshape and reorder Arabic text for correct PDF rendering."""
    if not _is_arabic(text):
        return text
    try:
        reshaped = arabic_reshaper.reshape(text)
        bidi_text = get_display(reshaped)
        return bidi_text
    except Exception:
        return text


def _clean(text: str) -> str:
    """Remove markdown symbols and clean text for PDF."""
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'#+\s*', '', text)
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text.strip()


def _clean_arabic(text: str) -> str:
    """Clean text AND reshape Arabic if present."""
    cleaned = _clean(text)
    return _reshape_arabic(cleaned)


def _is_retryable_status(status_code: int) -> bool:
    return status_code in {429, 500, 502, 503, 504}


def call_gemini_api(system_prompt: str, user_prompt: str, max_tokens: int = 8192, model_name: str = None) -> str:
    """Call Gemini API and return the generated text."""
    preferred_model = model_name or GEMINI_MODEL
    models_to_try = [preferred_model]
    if model_name is None:
        models_to_try = GEMINI_MODELS_TO_TRY or [GEMINI_MODEL]

    max_retries = max(1, GEMINI_HTTP_MAX_RETRIES)
    base_delay = max(0.1, GEMINI_HTTP_RETRY_BASE_DELAY_SEC)

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": max_tokens,
        }
    }

    timeout_value = (GEMINI_CONNECT_TIMEOUT_SEC, GEMINI_REQUEST_TIMEOUT_SEC)
    last_error: Exception | None = None

    for model_idx, model in enumerate(models_to_try, start=1):
        for attempt in range(1, max_retries + 1):
            started_at = time.time()
            response = None
            print(
                f"  → Gemini request started for {model} "
                f"(model {model_idx}/{len(models_to_try)}, attempt {attempt}/{max_retries}, "
                f"connect_timeout={GEMINI_CONNECT_TIMEOUT_SEC}s, read_timeout={GEMINI_REQUEST_TIMEOUT_SEC}s)"
            )
            try:
                response = requests.post(build_gemini_url(model), json=payload, timeout=timeout_value)
                response.raise_for_status()

                try:
                    data = response.json()
                except ValueError as exc:
                    response_preview = response.text[:500] if response is not None else ""
                    raise ValueError(
                        f"Gemini returned non-JSON response. Preview: {response_preview}"
                    ) from exc

                candidates = data.get("candidates", [])
                if not candidates:
                    raise ValueError("No candidates returned from Gemini API")

                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if not parts:
                    raise ValueError("No parts in Gemini response")

                output_text = parts[0].get("text", "")
                if not output_text or not output_text.strip():
                    raise ValueError("Gemini response text is empty")

                return output_text
            except requests.Timeout as exc:
                elapsed = time.time() - started_at
                last_error = TimeoutError(
                    f"Gemini request timed out after {elapsed:.1f}s "
                    f"(connect={GEMINI_CONNECT_TIMEOUT_SEC}s, read={GEMINI_REQUEST_TIMEOUT_SEC}s)"
                )
            except requests.HTTPError as exc:
                status_code = exc.response.status_code if exc.response is not None else None
                body_preview = exc.response.text[:500] if exc.response is not None else ""
                last_error = RuntimeError(
                    f"Gemini HTTP error {status_code if status_code is not None else 'unknown'}. "
                    f"Response preview: {body_preview}"
                )

                if status_code is not None and not _is_retryable_status(status_code):
                    raise last_error from exc
            except requests.RequestException as exc:
                last_error = RuntimeError(f"Gemini request failed: {exc}")
            finally:
                elapsed = time.time() - started_at
                print(f"  ← Gemini request for {model} finished in {elapsed:.1f}s")

            if attempt < max_retries:
                backoff = min(8.0, base_delay * (2 ** (attempt - 1)))
                print(f"  🔄 Retryable Gemini failure on {model}; retrying in {backoff:.1f}s...")
                time.sleep(backoff)
            else:
                print(f"  ❌ Model {model} exhausted {max_retries} HTTP attempts")

        if model_idx < len(models_to_try):
            print("  🔁 Switching to Gemini fallback model...")

    if last_error is not None:
        raise RuntimeError(
            f"Gemini failed after trying models: {', '.join(models_to_try)}. Last error: {last_error}"
        ) from last_error
    raise RuntimeError("Gemini failed without a captured error")


def build_lesson_pdf(
    whisper_result: dict,
    audio_file: str,
    out_path: str = "gemini_structured_lesson.pdf"
) -> str:
    """Deprecated - use build_lesson_pdf_from_json instead."""
    raise NotImplementedError("Use generate_lesson_pdf_and_json() which uses build_lesson_pdf_from_json()")


def build_lesson_pdf_from_json(
    lesson_data: dict,
    detected_lang: str = "en",
    out_path: str = "lesson.pdf"
) -> str:
    """Generate a modern beautiful PDF from lesson JSON data."""
    pdf_started_at = time.time()
    font_started_at = time.time()
    print("→ Preparing PDF renderer...")
    _register_arabic_font()
    print(f"← PDF font setup finished in {time.time() - font_started_at:.2f}s")
    
    is_ar = detected_lang.lower().startswith("ar") or _is_arabic(lesson_data.get("title", ""))
    text_align = TA_RIGHT if is_ar else TA_LEFT
    font_name = _ARABIC_FONT_NAME if is_ar else "Helvetica"
    font_name_bold = f"{_ARABIC_FONT_NAME}-Bold" if is_ar else "Helvetica-Bold"
    
    process = _clean_arabic if is_ar else lambda x: _clean(x)
    
    # Subject color
    subject_color = lesson_data.get("subjectColor", "#2DD4BF")
    
    doc = SimpleDocTemplate(
        out_path, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )
    styles = getSampleStyleSheet()
    
    # Modern styles
    S = {}
    S["header_bg"] = ParagraphStyle("HeaderBg", backgroundColor=colors.HexColor(subject_color),
        spaceBefore=0, spaceAfter=0, padding=8*mm)
    S["title"] = ParagraphStyle("Title", fontSize=26, textColor=colors.HexColor("#1E3A6E"),
        fontName=font_name_bold, spaceAfter=2, alignment=TA_CENTER)
    S["subtitle"] = ParagraphStyle("Sub", fontSize=11, textColor=colors.HexColor("#666666"),
        fontName=font_name, alignment=TA_CENTER, spaceAfter=6)
    S["section"] = ParagraphStyle("Sec", fontSize=14, textColor=colors.HexColor(subject_color),
        fontName=font_name_bold, spaceBefore=12, spaceAfter=4)
    S["subsection"] = ParagraphStyle("SubSec", fontSize=12, textColor=colors.HexColor("#2E5FAA"),
        fontName=font_name_bold, spaceBefore=8, spaceAfter=2)
    S["body"] = ParagraphStyle("Body", fontSize=10, leading=16, spaceAfter=4,
        fontName=font_name, alignment=text_align)
    S["bullet"] = ParagraphStyle("Bullet", fontSize=10, leading=14, spaceAfter=2,
        fontName=font_name, leftIndent=12, alignment=text_align)
    S["chapter_num"] = ParagraphStyle("ChapNum", fontSize=24, textColor=colors.HexColor(subject_color),
        fontName=font_name_bold, spaceAfter=2)
    S["chapter_title"] = ParagraphStyle("ChapTitle", fontSize=14, textColor=colors.HexColor("#1E3A6E"),
        fontName=font_name_bold, spaceAfter=4)
    S["chapter_content"] = ParagraphStyle("ChapContent", fontSize=10, leading=16, spaceAfter=8,
        fontName=font_name, alignment=text_align)
    S["vocab_term"] = ParagraphStyle("VocabTerm", fontSize=11, textColor=colors.HexColor("#1E3A6E"),
        fontName=font_name_bold, spaceBefore=6, spaceAfter=1)
    S["vocab_def"] = ParagraphStyle("VocabDef", fontSize=10, leading=14, spaceAfter=4,
        fontName=font_name, alignment=text_align)
    S["objective"] = ParagraphStyle("Obj", fontSize=10, leading=14, spaceAfter=3,
        fontName=font_name, leftIndent=8, alignment=text_align)
    S["xp_badge"] = ParagraphStyle("XP", fontSize=9, textColor=colors.HexColor("#FF6B35"),
        fontName=font_name_bold, alignment=TA_CENTER)
    S["duration"] = ParagraphStyle("Dur", fontSize=9, textColor=colors.HexColor("#666666"),
        fontName=font_name, alignment=TA_CENTER)
    
    story = []
    
    # Header with logo
    story.append(Paragraph("🎓 Learno", ParagraphStyle("Logo", fontSize=18, textColor=colors.HexColor(subject_color), fontName=font_name_bold, alignment=TA_LEFT)))
    story.append(Spacer(1, 3*mm))
    
    # Title and metadata
    title = process(lesson_data.get("title", "Lesson"))
    story.append(Paragraph(title, S["title"]))
    
    subject = process(lesson_data.get("subject", ""))
    desc = process(lesson_data.get("description", ""))
    story.append(Paragraph(f"<b>{subject}</b> · {lesson_data.get('difficulty', '')}", S["subtitle"]))
    if desc:
        story.append(Paragraph(desc, S["subtitle"]))
    
    # Duration and XP
    duration = lesson_data.get("totalDurationMin", 0)
    xp = lesson_data.get("totalXP", 0)
    story.append(Paragraph(f"⏱️ {duration} min &nbsp;&nbsp; 🏆 {xp} XP", ParagraphStyle("Meta", fontSize=10, textColor=colors.HexColor("#888888"), alignment=TA_CENTER, spaceAfter=8)))
    
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(subject_color)))
    story.append(Spacer(1, 4*mm))
    
    # Learning Objectives
    objectives = lesson_data.get("learningObjectives", [])
    if objectives:
        story.append(Paragraph("🎯 " + ("أهداف التعلم" if is_ar else "Learning Objectives"), S["section"]))
        for obj in objectives:
            story.append(Paragraph(f"• {process(obj)}", S["objective"]))
    
    # Key Vocabulary
    vocab = lesson_data.get("keyVocabulary", [])
    if vocab:
        story.append(Paragraph("📚 " + ("المفردات الأساسية" if is_ar else "Key Vocabulary"), S["section"]))
        for v in vocab:
            term = process(v.get("term", ""))
            definition = process(v.get("definition", ""))
            story.append(Paragraph(term, S["vocab_term"]))
            story.append(Paragraph(definition, S["vocab_def"]))
    
    # Chapters
    chapters = lesson_data.get("chapters", [])
    for ch in chapters:
        story.append(Spacer(1, 6*mm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#DDDDDD")))
        story.append(Spacer(1, 4*mm))
        
        ch_num = ch.get("chapterNumber", 1)
        ch_title = process(ch.get("title", f"Chapter {ch_num}"))
        ch_duration = ch.get("durationMin", 0)
        ch_xp = ch.get("xpReward", 0)
        
        story.append(Paragraph(f"{ch_num}. {ch_title}", S["chapter_title"]))
        story.append(Paragraph(f"⏱️ {ch_duration} min · 🏆 {ch_xp} XP", S["duration"]))
        
        # Key insight
        insight = ch.get("keyInsight", "")
        if insight:
            insight_text = "💡 " + process(insight)
            story.append(Paragraph(insight_text, ParagraphStyle("Insight", fontSize=10, textColor=colors.HexColor("#FF6B35"), fontName=font_name, spaceBefore=4, spaceAfter=4, alignment=text_align)))
        
        # Key points
        key_points = ch.get("keyPoints", [])
        if key_points:
            story.append(Paragraph("• " + ("نقاط أساسية" if is_ar else "Key Points") + ": " + ", ".join([process(p) for p in key_points]), S["bullet"]))
        
        # Content
        content = process(ch.get("content", ""))
        if content:
            story.append(Paragraph(content, S["chapter_content"]))
        
        # Summary
        summary = ch.get("summary", "")
        if summary:
            summary_label = "ملخص" if is_ar else "Summary"
            story.append(Paragraph(f"<b>{summary_label}:</b> {process(summary)}", ParagraphStyle("Summary", fontSize=10, textColor=colors.HexColor("#666666"), fontName=font_name, spaceBefore=4, alignment=text_align)))
    
    # Footer
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#DDDDDD")))
    story.append(Paragraph(f"Generated by Learno AI · {time.strftime('%Y-%m-%d')}", ParagraphStyle("Footer", fontSize=8, textColor=colors.HexColor("#999999"), alignment=TA_CENTER, spaceBefore=4)))
    
    build_started_at = time.time()
    print(f"→ Writing PDF content ({len(story)} elements) to disk...")
    doc.build(story)
    print(f"← PDF content write finished in {time.time() - build_started_at:.2f}s")
    size_kb = os.path.getsize(out_path) // 1024
    print(f"✅ Lesson PDF from JSON saved -> {out_path} [{size_kb} KB]")
    print(f"✅ PDF pipeline complete in {time.time() - pdf_started_at:.2f}s")
    return out_path
