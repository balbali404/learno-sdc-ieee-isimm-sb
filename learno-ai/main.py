"""
Learno AI - Main Entry Point
Command-line interface for processing classroom recordings.
"""

import argparse
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(
        description="Learno AI - Classroom Audio Analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py audio.wav                    # Process with defaults
  python main.py audio.wav --whisper large    # Use large Whisper model
  python main.py audio.wav --intro 90         # 90 second intro for teacher ID
  python main.py --streamlit                  # Launch Streamlit web app
        """
    )

    parser.add_argument("audio_file", nargs="?", help="Path to audio file to process")
    parser.add_argument("--intro", type=float, default=60, help="Intro duration for teacher ID (default: 60s)")
    parser.add_argument("--whisper", default="base", choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--language", help="Force language (e.g., en, fr, ar)")
    parser.add_argument("--no-lesson", action="store_true", help="Skip lesson PDF generation")
    parser.add_argument("--no-advice", action="store_true", help="Skip advice PDF generation")
    parser.add_argument("--output-dir", help="Output directory (default: same as audio file)")
    parser.add_argument("--streamlit", action="store_true", help="Launch Streamlit web app")

    args = parser.parse_args()

    if args.streamlit:
        launch_streamlit()
        return

    if not args.audio_file:
        parser.print_help()
        print("\nError: audio_file is required unless using --streamlit")
        sys.exit(1)

    if not os.path.exists(args.audio_file):
        print(f"Error: Audio file not found: {args.audio_file}")
        sys.exit(1)

    process_audio_cli(
        audio_file=args.audio_file,
        intro_duration=args.intro,
        whisper_model=args.whisper,
        language=args.language,
        generate_lesson=not args.no_lesson,
        generate_advice=not args.no_advice,
        output_dir=args.output_dir
    )


def launch_streamlit():
    """Launch the Streamlit web application."""
    import subprocess
    app_path = os.path.join(os.path.dirname(__file__), "app.py")
    print("🚀 Launching Learno AI Streamlit app...")
    subprocess.run([sys.executable, "-m", "streamlit", "run", app_path])


def process_audio_cli(audio_file, intro_duration, whisper_model, language,
                      generate_lesson, generate_advice, output_dir):
    """Process audio file via command line."""

    output_dir = output_dir or os.path.dirname(audio_file) or os.getcwd()
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 60)
    print("🎓 LEARNO AI - Classroom Audio Analysis")
    print("=" * 60)
    print(f"Audio file: {audio_file}")
    print(f"Output dir: {output_dir}")
    print()

    # Step 1: Diarization
    print("📊 Step 1/4: Running speaker diarization...")
    from diarization.session import process_session
    session_result = process_session(
        audio_file,
        intro_duration=intro_duration,
        save_json=True
    )
    print(f"   ✅ Diarization complete")
    print(f"   Teacher: {session_result['teacher_label']}")
    print(f"   Teacher ratio: {session_result['json']['teacher_ratio']*100:.1f}%")
    print()

    # Step 2: Transcription
    print("🎙️ Step 2/4: Transcribing teacher audio...")
    teacher_wav = session_result.get("teacher_recap_path")
    whisper_result = None

    if teacher_wav and os.path.exists(teacher_wav):
        from transcription import transcribe_teacher_audio
        whisper_result = transcribe_teacher_audio(
            teacher_wav,
            model_size=whisper_model,
            language=language
        )
        print(f"   ✅ Transcription complete")
        print(f"   Language: {whisper_result.get('language', 'unknown')}")
        print(f"   Segments: {len(whisper_result.get('segments', []))}")
    else:
        print("   ⚠️ Could not extract teacher audio")
    print()

    # Step 3: Lesson PDF
    if generate_lesson and whisper_result:
        print("📚 Step 3/4: Generating lesson PDF...")
        from gemini import build_lesson_pdf
        lesson_path = os.path.join(output_dir, "learno_lesson.pdf")
        build_lesson_pdf(whisper_result, audio_file, out_path=lesson_path)
        print(f"   ✅ Lesson PDF: {lesson_path}")
    else:
        print("📚 Step 3/4: Skipping lesson PDF")
    print()

    # Step 4: Advice PDF
    if generate_advice:
        print("💡 Step 4/4: Generating teacher advice PDF...")
        from gemini import build_advice_pdf
        advice_path = os.path.join(output_dir, "learno_advice.pdf")
        build_advice_pdf(
            session_result["json"],
            os.path.basename(audio_file),
            out_path=advice_path
        )
        print(f"   ✅ Advice PDF: {advice_path}")
    else:
        print("💡 Step 4/4: Skipping advice PDF")
    print()

    print("=" * 60)
    print("✅ Processing complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
