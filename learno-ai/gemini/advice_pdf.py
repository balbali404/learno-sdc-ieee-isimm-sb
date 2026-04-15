"""Teacher advice PDF generation with Gemini API."""

import os
import re
import time
from typing import List, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle

from .prompts import build_advice_prompt
from .lesson_pdf import (
    call_gemini_api, _clean, _clean_arabic, _reshape_arabic,
    _is_arabic, _register_arabic_font, _ARABIC_FONT_NAME
)


def generate_advice_text(analytics: dict, session_name: str) -> str:
    """Call Gemini to generate teacher advice text."""
    system_prompt, user_prompt = build_advice_prompt(analytics, session_name)

    print("Calling Gemini API to generate teacher advice...")
    advice_text = call_gemini_api(system_prompt, user_prompt)
    print(f"Received {len(advice_text)} characters from Gemini")
    return advice_text


def extract_advice_points(advice_text: str, max_points: int = 3) -> List[str]:
    """Extract up to `max_points` concise advice phrases from Gemini text."""
    bullets: List[str] = []
    bullet_re = re.compile(r"^[\-\*]\s*(.+)$")
    numbered_re = re.compile(r"^\d+[\.)\]]\s*(.+)$")

    for raw in advice_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = bullet_re.match(line) or numbered_re.match(line)
        if m:
            bullets.append(_clean(m.group(1)))
        if len(bullets) >= max_points:
            break

    if len(bullets) < max_points:
        sentences = re.split(r"(?<=[.!?])\s+", advice_text)
        for sent in sentences:
            cleaned = _clean(sent.strip())
            if cleaned:
                bullets.append(cleaned)
            if len(bullets) >= max_points:
                break

    return bullets[:max_points]


def build_advice_pdf(
    analytics: dict,
    session_name: str,
    out_path: str = "gemini_teacher_advice.pdf",
    advice_text: Optional[str] = None,
    return_text: bool = False
) -> str | tuple:
    """Generate a teacher advice PDF using Gemini API."""
    # Register Arabic font
    _register_arabic_font()

    advice_text = advice_text or generate_advice_text(analytics, session_name)

    # Detect if content is Arabic
    is_ar = _is_arabic(advice_text)
    text_align = TA_RIGHT if is_ar else TA_JUSTIFY

    # Import the current font name (may have been updated during registration)
    from .lesson_pdf import _ARABIC_FONT_NAME as current_font
    font_name = current_font if is_ar else "Helvetica"
    font_name_bold = f"{current_font}-Bold" if is_ar else "Helvetica-Bold"

    # Choose text processor based on language
    process = _clean_arabic if is_ar else _clean

    # Build PDF
    doc = SimpleDocTemplate(
        out_path, pagesize=A4,
        leftMargin=22*mm, rightMargin=22*mm,
        topMargin=22*mm, bottomMargin=22*mm,
    )
    styles = getSampleStyleSheet()

    S = {}
    S["title"] = ParagraphStyle("ATitle", parent=styles["Title"],
        fontSize=20, textColor=colors.HexColor("#1B4F72"),
        fontName=font_name_bold if is_ar else "Helvetica-Bold",
        spaceAfter=4, alignment=TA_CENTER)
    S["subtitle"] = ParagraphStyle("ASub", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#555"),
        fontName=font_name,
        alignment=TA_CENTER, spaceAfter=2)
    S["section"] = ParagraphStyle("ASec", parent=styles["Heading1"],
        fontSize=12, textColor=colors.HexColor("#1B4F72"),
        fontName=font_name_bold if is_ar else "Helvetica-Bold",
        spaceBefore=10, spaceAfter=3, leading=15,
        alignment=text_align)
    S["body"] = ParagraphStyle("ABody", parent=styles["Normal"],
        fontSize=10, leading=15, spaceAfter=4,
        fontName=font_name,
        alignment=text_align)
    S["bullet"] = ParagraphStyle("ABull", parent=styles["Normal"],
        fontSize=10, leading=14, spaceAfter=2,
        fontName=font_name,
        leftIndent=14,
        alignment=text_align)
    S["kpi_label"] = ParagraphStyle("AKPI", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#333"),
        fontName=font_name,
        alignment=TA_CENTER)
    S["kpi_val"] = ParagraphStyle("AKPIv", parent=styles["Normal"],
        fontSize=16, textColor=colors.HexColor("#1B4F72"),
        fontName=font_name_bold if is_ar else "Helvetica-Bold",
        alignment=TA_CENTER)

    story = []

    # Cover
    story.append(Paragraph("Learno - Teacher Performance Report", S["title"]))
    story.append(Paragraph(
        f"Session: {session_name} &nbsp;&nbsp;|&nbsp;&nbsp; Generated: {time.strftime('%Y-%m-%d %H:%M')}",
        S["subtitle"]
    ))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1B4F72")))
    story.append(Spacer(1, 5*mm))

    # KPI snapshot table from analytics
    t_ratio = analytics.get("teacher_ratio", 0)
    s_ratio = analytics.get("student_ratio", 0)
    t_min = analytics.get("teacher_minutes", 0)
    s_min = analytics.get("student_minutes", 0)
    gaps = analytics.get("silence_gaps", [])
    eng = analytics.get("advanced_metrics", {}).get("engagement_score", {}).get("score", "N/A")

    kpi_data = [
        [Paragraph("Teacher Talk", S["kpi_label"]),
         Paragraph("Student Talk", S["kpi_label"]),
         Paragraph("Silence Gaps", S["kpi_label"]),
         Paragraph("Engagement", S["kpi_label"])],
        [Paragraph(f"{t_ratio*100:.0f}%", S["kpi_val"]),
         Paragraph(f"{s_ratio*100:.0f}%", S["kpi_val"]),
         Paragraph(str(len(gaps)), S["kpi_val"]),
         Paragraph(str(eng), S["kpi_val"])],
        [Paragraph(f"{t_min} min", S["kpi_label"]),
         Paragraph(f"{s_min} min", S["kpi_label"]),
         Paragraph("detected", S["kpi_label"]),
         Paragraph("/ 100", S["kpi_label"])],
    ]
    W = A4[0] - 44*mm
    kpi_tbl = Table(kpi_data, colWidths=[W/4]*4, rowHeights=[7*mm, 12*mm, 6*mm])
    kpi_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#EBF4FC")),
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#AACDE8")),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(kpi_tbl)
    story.append(Spacer(1, 6*mm))

    # Parse Gemini advice text
    SECTION_RE = re.compile(r'^([A-Z][A-Z &/\-]{3,}):(.*)$')
    AR_SECTION_RE = re.compile(r'^[\u0600-\u06FF][\u0600-\u06FF\s]{3,}:\s*(.*)$')

    for line in advice_text.split("\n"):
        raw = line.rstrip()
        if not raw:
            story.append(Spacer(1, 2*mm))
            continue

        m = SECTION_RE.match(raw)
        m_ar = AR_SECTION_RE.match(raw) if is_ar else None

        if m:
            story.append(Spacer(1, 2*mm))
            story.append(Paragraph(process(m.group(1)), S["section"]))
            if m.group(2).strip():
                story.append(Paragraph(process(m.group(2)), S["body"]))
        elif m_ar:
            parts = raw.split(":", 1)
            label = process(parts[0])
            rest = process(parts[1]) if len(parts) > 1 else ""
            story.append(Spacer(1, 2*mm))
            story.append(Paragraph(label, S["section"]))
            if rest:
                story.append(Paragraph(rest, S["body"]))
        elif raw.strip().startswith(("-", "*")):
            text = process(raw.strip().lstrip("-* "))
            bullet_char = "• " if is_ar else "* "
            story.append(Paragraph(f"{bullet_char}{text}", S["bullet"]))
        elif raw.strip() and raw.strip()[0].isdigit() and len(raw.strip()) > 1 and raw.strip()[1] in ".):" :
            story.append(Paragraph(f"&nbsp;&nbsp;{process(raw.strip())}", S["body"]))
        else:
            story.append(Paragraph(process(raw.strip()), S["body"]))

    doc.build(story)
    size_kb = os.path.getsize(out_path) // 1024
    print(f"✅ Teacher advice PDF saved -> {out_path}  [{size_kb} KB]")
    if return_text:
        return out_path, advice_text
    return out_path
