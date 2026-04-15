"""PDF generation for teacher transcripts."""

import os
import time

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, PageBreak
)


def save_teacher_transcript_pdf(
    whisper_result: dict,
    audio_file_name: str,
    teacher_label: str,
    out_path: str = "teacher_transcript.pdf",
) -> str:
    """
    Build a clean, Unicode-safe PDF transcript from a Whisper result.

    Layout:
    - Cover header: session name, teacher label, language, date
    - Segmented table: timestamp | transcribed text
    - Full plain-text block at the end
    """
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    W = A4[0] - 40 * mm

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "LearnoTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#1E50A0"),
        spaceAfter=4,
        alignment=TA_CENTER,
    )
    meta_style = ParagraphStyle(
        "LearnoMeta",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#505050"),
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "LearnoSection",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#1E50A0"),
        spaceBefore=10,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "LearnoBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=15,
        spaceAfter=0,
    )
    ts_style = ParagraphStyle(
        "LearnoTS",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#444444"),
        alignment=TA_CENTER,
    )
    seg_style = ParagraphStyle(
        "LearnoSeg",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
    )

    story = []

    # Title
    story.append(Paragraph("Learno - Teacher Transcript", title_style))
    story.append(Spacer(1, 3 * mm))

    # Metadata
    session_name = os.path.basename(audio_file_name)
    lang = whisper_result.get("language", "unknown").upper()
    generated = time.strftime("%Y-%m-%d %H:%M:%S")

    for line in [
        f"Session: {session_name}",
        f"Teacher speaker label: {teacher_label}",
        f"Detected language: {lang}",
        f"Generated: {generated}",
    ]:
        story.append(Paragraph(line, meta_style))

    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CCCCCC")))
    story.append(Spacer(1, 4 * mm))

    # Segmented transcript table
    story.append(Paragraph("Segmented Transcript", section_style))

    segments = whisper_result.get("segments", [])

    col_ts_w = 32 * mm
    col_tx_w = W - col_ts_w

    header = [
        Paragraph("<b>Timestamp</b>", ts_style),
        Paragraph("<b>Text</b>", seg_style),
    ]
    table_data = [header]

    for seg in segments:
        start = float(seg.get("start", 0))
        end = float(seg.get("end", 0))
        text = seg.get("text", "").strip()
        ts = (
            f"{int(start // 60):02d}:{int(start % 60):02d}"
            f" -> "
            f"{int(end // 60):02d}:{int(end % 60):02d}"
        )
        table_data.append([
            Paragraph(ts, ts_style),
            Paragraph(text, seg_style),
        ])

    tbl = Table(
        table_data,
        colWidths=[col_ts_w, col_tx_w],
        repeatRows=1,
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCE8FF")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1E1E1E")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
            [colors.white, colors.HexColor("#F5F8FF")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 8 * mm))

    # Full plain transcript
    story.append(PageBreak())
    story.append(Paragraph("Full Transcript", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC")))
    story.append(Spacer(1, 3 * mm))

    full_text = whisper_result.get("text", "").strip()
    for block in full_text.split("\n\n"):
        block = block.strip()
        if block:
            story.append(Paragraph(block.replace("\n", " "), body_style))
            story.append(Spacer(1, 3 * mm))

    doc.build(story)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"Teacher transcript PDF saved -> {out_path}  [{size_kb} KB]")
    print(f"   Language : {lang}")
    print(f"   Segments : {len(segments)}")
    return out_path
