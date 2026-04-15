"""Prompt templates for Gemini API."""

import os
import json


LESSON_SYSTEM_PROMPT = (
    "You are an expert educational content designer specializing in creating comprehensive student revision guides.\n"
    "Your task is to transform raw classroom transcripts into detailed, student-friendly lesson documents for self-study and review.\n"
    "Your output must be in the SAME LANGUAGE as the transcript (auto-detected).\n"
    "If the teacher speaks Arabic, write everything in Arabic. If French, write in French, etc.\n"
    "Always produce clean structured text - no markdown symbols like **, ##, or *.\n"
    "Use SECTION labels in UPPERCASE followed by a colon on their own line.\n"
    "Write in a clear, engaging, educational tone aimed directly at the student.\n"
    "Include thorough explanations, worked examples, and practice questions.\n"
    "Produce a complete, professional revision document that a student can study from independently."
)

LESSON_JSON_SYSTEM_PROMPT = (
    "You are an expert educational content designer who creates engaging, age-appropriate lesson content.\n"
    "Your task is to transform classroom transcripts into structured lesson content with multiple chapters.\n"
    "CRITICAL: You must output ONLY valid JSON - no markdown, no explanations, no text before or after.\n"
    "CRITICAL: Do NOT include trailing commas in arrays or objects.\n"
    "CRITICAL: Escape all special characters in strings (newlines as \\n, quotes as \\\").\n"
    "CRITICAL: Output content in the SAME LANGUAGE as the transcript - if the teacher speaks Arabic, write everything in Arabic. If French, write in French, etc.\n"
    "Adapt content complexity and vocabulary to the student's grade level.\n"
    "Each chapter should be self-contained and progressively build understanding."
)

ADVICE_SYSTEM_PROMPT = (
    "You are an expert instructional coach and educational psychologist.\n"
    "You receive structured classroom audio analytics produced by a speaker diarization and audio analysis pipeline.\n"
    "Your job is to write a warm, professional, data-driven teacher performance report with specific, actionable advice.\n"
    "Structure your response with clear SECTION labels in UPPERCASE followed by a colon, on their own line.\n"
    "Do NOT use markdown symbols (**, ##, *, etc.).\n"
    "Be specific, cite the numbers from the data, and provide 3-5 concrete improvement suggestions.\n"
    "Always end with a motivating closing message for the teacher."
)


def build_lesson_prompt(whisper_result: dict, audio_file: str) -> tuple:
    """Build the lesson generation prompt from Whisper result."""
    transcript_text = whisper_result.get("text", "").strip()
    detected_lang = whisper_result.get("language", "unknown").upper()
    session_name = os.path.basename(audio_file)

    # Include timed segments for richer context
    seg_lines = []
    for seg in whisper_result.get("segments", []):
        s = int(seg.get("start", 0))
        e = int(seg.get("end", 0))
        ts = f"{s//60:02d}:{s%60:02d} -> {e//60:02d}:{e%60:02d}"
        seg_lines.append(f"[{ts}] {seg.get('text','').strip()}")
    timed_transcript = "\n".join(seg_lines)

    user_prompt = f"""Below is a teacher's classroom transcript (language: {detected_lang}) from session '{session_name}'.
Transform it into a COMPREHENSIVE STUDENT REVISION GUIDE. This document is for students to study from independently.
Write everything as if you are explaining directly to the student.

Use these sections:

LESSON TITLE: (infer a clear, descriptive title from the content)
SUBJECT & LEVEL: (infer subject and approximate grade/level)
LEARNING OBJECTIVES: (3-5 clear objectives - what the student will master)
KEY VOCABULARY: (important terms with clear, student-friendly definitions and examples)
DETAILED LESSON CONTENT:
  For each main topic covered in the lesson, provide:
  - A clear explanation of the concept in simple, understandable language
  - Why this concept matters and how it connects to what the student already knows
  - Worked examples with step-by-step solutions (use the examples from the lesson)
  - Common mistakes to avoid
  - Tips and memory aids to help remember key points
CONCEPT SUMMARY: (a concise recap of all main ideas covered, organized as clear bullet points)
PRACTICE EXERCISES: (5-10 questions or problems for the student to test their understanding, ranging from easy to challenging)
REVIEW QUESTIONS: (3-5 thought-provoking questions that test deeper understanding)

IMPORTANT RULES:
- Do NOT include any teacher notes, pedagogical analysis, or classroom management observations
- Write everything as a student-facing revision resource
- Be thorough and detailed - this should be enough for a student to fully understand the topic
- Use the same language as the transcript

--- TIMED TRANSCRIPT ---
{timed_transcript}

--- FULL TRANSCRIPT ---
{transcript_text}
"""
    return LESSON_SYSTEM_PROMPT, user_prompt, session_name, detected_lang


def build_lesson_json_prompt(whisper_result: dict, audio_file: str, grade_level: int = 10, age: int = None) -> tuple:
    """
    Build a prompt for generating structured JSON lesson content with chapters.
    
    Parameters
    ----------
    whisper_result : dict - Whisper transcription result
    audio_file : str - Path to the audio file
    grade_level : int - Student grade level (e.g., 10 for Grade 10)
    age : int - Student age (optional, derived from grade_level if not provided)
    
    Returns
    -------
    tuple - (system_prompt, user_prompt, session_name, detected_lang)
    """
    transcript_text = whisper_result.get("text", "").strip()
    detected_lang = whisper_result.get("language", "unknown").upper()
    session_name = os.path.basename(audio_file)
    
    # Derive age from grade level if not provided
    if age is None:
        age = grade_level + 5  # Grade 10 = ~15 years old
    
    # Determine difficulty based on grade
    if grade_level <= 6:
        difficulty = "BEGINNER"
        complexity_guide = "Use simple vocabulary, short sentences, and relatable everyday examples."
    elif grade_level <= 9:
        difficulty = "INTERMEDIATE"
        complexity_guide = "Use moderate vocabulary with clear explanations of technical terms."
    else:
        difficulty = "ADVANCED"
        complexity_guide = "Use appropriate academic vocabulary while maintaining clarity."

    # Include timed segments
    seg_lines = []
    for seg in whisper_result.get("segments", []):
        s = int(seg.get("start", 0))
        e = int(seg.get("end", 0))
        ts = f"{s//60:02d}:{s%60:02d} -> {e//60:02d}:{e%60:02d}"
        seg_lines.append(f"[{ts}] {seg.get('text','').strip()}")
    timed_transcript = "\n".join(seg_lines)

    user_prompt = f"""Transform this classroom transcript into a structured lesson JSON for students.

TARGET AUDIENCE:
- Grade Level: {grade_level}
- Age: ~{age} years old
- Difficulty: {difficulty}
- {complexity_guide}

LANGUAGE: Write everything in the SAME LANGUAGE as the transcript ({detected_lang}). This is CRITICAL.

OUTPUT FORMAT (respond with ONLY this JSON structure, no other text):
{{
  "title": "Clear descriptive lesson title (write in {detected_lang} language)",
  "subject": "Subject name (write in {detected_lang} language, e.g., Biology, Physics, Mathematics)",
  "subjectColor": "#HexColor appropriate for subject",
  "description": "2-3 sentence engaging description of what students will learn (write in {detected_lang} language)",
  "difficulty": "{difficulty}",
  "gradeLevel": {grade_level},
  "ageGroup": "{age-1}-{age+1}",
  "totalDurationMin": 25,
  "totalXP": 120,
  "chapters": [
    {{
      "chapterNumber": 1,
      "title": "Chapter title - clear and engaging (write in {detected_lang} language)",
      "content": "Full chapter content written for the target age group in {detected_lang} language. Include explanations, examples, and engaging language. 200-400 words per chapter.",
      "summary": "1-2 sentence chapter summary (write in {detected_lang} language)",
      "durationMin": 5,
      "readingTimeSec": 120,
      "xpReward": 30,
      "keyInsight": "One memorable fact or insight from this chapter (write in {detected_lang} language)",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }}
  ],
  "keyVocabulary": [
    {{"term": "Term", "definition": "Age-appropriate definition"}}
  ],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
}}

LANGUAGE REQUIREMENTS:
- ALL text fields (title, subject, description, chapters content, summary, keyInsight, keyPoints) must be in {detected_lang}
- Do NOT mix languages - write ONLY in the transcript language
- This includes the subject name - use the {detected_lang} name (e.g., "الرياضيات" for Arabic, "Mathématiques" for French)

SUBJECT COLOR SUGGESTIONS:
- Biology/Life Sciences: "#2DD4BF" (teal)
- Physics: "#F59E0B" (amber)  
- Chemistry: "#8B5CF6" (purple)
- Mathematics: "#3B82F6" (blue)
- English/Literature: "#EC4899" (pink)
- History: "#F97316" (orange)
- Geography: "#22C55E" (green)

GUIDELINES:
1. Create 3-5 chapters that progressively build understanding
2. Each chapter should have ONE key insight - a memorable "wow" fact
3. CRITICAL: Output content in {detected_lang} language ONLY - same as the transcript
4. CRITICAL: Write ALL text fields (title, subject, description, chapter content, summaries, keyInsight) in {detected_lang} language
5. XP rewards should total 100-150 for the whole lesson
6. Duration estimates should be realistic (3-8 min per chapter)
7. Content should be engaging and age-appropriate
8. NO trailing commas in JSON arrays or objects
9. Keep all text on single lines (no literal newlines inside strings)

--- TRANSCRIPT ---
{timed_transcript}

--- FULL TEXT ---
{transcript_text}

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT."""

    return LESSON_JSON_SYSTEM_PROMPT, user_prompt, session_name, detected_lang


def build_advice_prompt(analytics: dict, session_name: str) -> tuple:
    """Build the teacher advice prompt from analytics JSON."""
    analytics_str = json.dumps(analytics, indent=2, ensure_ascii=False)

    user_prompt = f"""You are analyzing a classroom recording from session: '{session_name}'.

Below is the full analytics JSON produced by Learno's pyannote diarization pipeline:

{analytics_str}

Please produce a professional teacher performance report with the following sections:

SESSION OVERVIEW: (date, duration, number of speakers, engagement score if present)
TALK TIME ANALYSIS: (interpret teacher vs student ratios - is the balance healthy?)
SILENCE & WAIT TIMES: (analyze silence gaps - what do they suggest? are they too long / too short?)
ENGAGEMENT SCORE: (interpret the engagement score, compare to benchmarks)
TURN TAKING & INTERACTION: (analyze how often students responded, quality of back-and-forth)
PACE & ENERGY: (comment on speaking pace and energy patterns if available)
INTERRUPTIONS & OVERLAP: (what do the interruption counts suggest?)
STRENGTHS OBSERVED: (2-3 specific strengths with data evidence)
AREAS FOR IMPROVEMENT: (3-5 specific, actionable suggestions with reference to the data)
RECOMMENDED STRATEGIES: (concrete classroom techniques to implement next session)
CLOSING MESSAGE: (a warm, encouraging note to the teacher)
"""
    return ADVICE_SYSTEM_PROMPT, user_prompt
