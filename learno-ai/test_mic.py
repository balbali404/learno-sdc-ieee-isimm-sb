"""
Quick test: Record from PC microphone and send to FastAPI for processing.
Press Ctrl+C to stop recording.
"""

import os
import sys
import wave
import time
import requests
import threading
from datetime import datetime
import numpy as np
import soundfile as sf

# Audio backends: prefer PyAudio, fallback to sounddevice (no VC++ build needed)
USING_PYAUDIO = False
try:
    import pyaudio
    USING_PYAUDIO = True
except ImportError:
    try:
        import sounddevice as sd
        USING_PYAUDIO = False
    except ImportError:
        print("ERROR: Neither PyAudio nor sounddevice is installed. Install one with:")
        print("  pip install --find-links https://www.lfd.uci.edu/~gohlke/pythonlibs/ pyaudio")
        print("  or: pip install sounddevice")
        sys.exit(1)

# =============================================================================
# Configuration
# =============================================================================

FASTAPI_URL = "http://localhost:8000"
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK = 1024
FORMAT = pyaudio.paInt16 if USING_PYAUDIO else "int16"

# =============================================================================
# Recording
# =============================================================================

def record_audio(output_path: str, duration: int = None):
    """Record audio from microphone. Press Ctrl+C to stop if no duration set."""

    if USING_PYAUDIO:
        p = pyaudio.PyAudio()

        # List available input devices
        print("\nAvailable microphones:")
        default_device = None
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            if info["maxInputChannels"] > 0:
                marker = ""
                if info.get("isDefaultInput") or "default" in info["name"].lower():
                    default_device = i
                    marker = " <-- DEFAULT"
                print(f"  [{i}] {info['name']}{marker}")

        if default_device is None:
            default_device = 0

        print(f"\nUsing device [{default_device}]")
        print("=" * 50)

        if duration:
            print(f"Recording for {duration} seconds...")
        else:
            print("Recording... Press Ctrl+C to stop")
        print("=" * 50)

        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=SAMPLE_RATE,
            input=True,
            input_device_index=default_device,
            frames_per_buffer=CHUNK
        )

        frames = []
        start_time = time.time()

        try:
            while True:
                data = stream.read(CHUNK, exception_on_overflow=False)
                frames.append(data)

                elapsed = time.time() - start_time
                print(f"\r  Recording: {elapsed:.1f}s", end="", flush=True)

                if duration and elapsed >= duration:
                    break

        except KeyboardInterrupt:
            print("\n  Stopped by user")

        print(f"\n  Total recorded: {time.time() - start_time:.1f}s")

        stream.stop_stream()
        stream.close()
        p.terminate()

        # Save to WAV
        with wave.open(output_path, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(p.get_sample_size(FORMAT))
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(b''.join(frames))

        print(f"  Saved: {output_path}")
        return output_path

    # sounddevice fallback (no C++ build tools required)
    print("\nUsing sounddevice backend")
    print("=" * 50)
    if duration:
        print(f"Recording for {duration} seconds...")
    else:
        print("Recording... Press Ctrl+C to stop")
    print("=" * 50)

    sd.default.samplerate = SAMPLE_RATE
    sd.default.channels = CHANNELS

    frames = []
    start_time = time.time()

    def callback(indata, frames_count, time_info, status):
        if status:
            print(f"\n[sd warning] {status}")
        frames.append(indata.copy())

    try:
        if duration:
            audio = sd.rec(int(duration * SAMPLE_RATE), dtype=FORMAT)
            while True:
                elapsed = time.time() - start_time
                print(f"\r  Recording: {elapsed:.1f}s", end="", flush=True)
                if elapsed >= duration:
                    break
                time.sleep(0.1)
            sd.wait()
            audio_np = audio
        else:
            with sd.InputStream(callback=callback, dtype=FORMAT):
                while True:
                    elapsed = time.time() - start_time
                    print(f"\r  Recording: {elapsed:.1f}s", end="", flush=True)
                    time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n  Stopped by user")
    finally:
        print(f"\n  Total recorded: {time.time() - start_time:.1f}s")

    if not duration:
        if not frames:
            raise RuntimeError("No audio captured")
        audio_np = np.concatenate(frames, axis=0)

    sf.write(output_path, audio_np, SAMPLE_RATE, subtype="PCM_16")
    print(f"  Saved: {output_path}")
    return output_path

# =============================================================================
# Upload to FastAPI
# =============================================================================

def upload_to_fastapi(audio_path: str, session_id: str = None):
    """Upload audio file to FastAPI for processing."""

    if session_id is None:
        session_id = f"test_{datetime.now().strftime('%H%M%S')}"

    print(f"\nUploading to FastAPI...")
    print(f"  Session ID: {session_id}")
    print(f"  File: {audio_path}")

    url = f"{FASTAPI_URL}/upload/{session_id}"

    with open(audio_path, "rb") as f:
        files = {"file": (os.path.basename(audio_path), f, "audio/wav")}
        response = requests.post(url, files=files)

    if response.status_code == 200:
        print(f"  Upload successful!")
        return response.json()
    else:
        print(f"  Upload failed: {response.status_code}")
        print(f"  {response.text}")
        return None

def check_result(session_id: str, max_wait: int = 300):
    """Poll for processing result."""

    print(f"\nWaiting for processing (max {max_wait}s)...")

    start = time.time()
    while time.time() - start < max_wait:
        try:
            response = requests.get(f"{FASTAPI_URL}/session/{session_id}")
            if response.status_code == 200:
                data = response.json()
                session = data.get("session", {})
                status = session.get("status", "unknown")

                print(f"\r  Status: {status}...", end="", flush=True)

                if status == "completed":
                    print("\n\n" + "=" * 50)
                    print("PROCESSING COMPLETE!")
                    print("=" * 50)

                    result = data.get("result", {})

                    print(f"\nTalk Time:")
                    print(f"  Teacher: {result.get('teacherMinutes', 0):.1f} min ({result.get('teacherRatio', 0)*100:.1f}%)")
                    print(f"  Student: {result.get('studentMinutes', 0):.1f} min ({result.get('studentRatio', 0)*100:.1f}%)")

                    print(f"\nEngagement:")
                    print(f"  Score: {result.get('engagementScore', 0)}")
                    print(f"  Band: {result.get('engagementBand', 'N/A')}")

                    print(f"\nSilence:")
                    print(f"  Count: {result.get('silenceCount', 0)} gaps")
                    print(f"  Longest: {result.get('longestSilenceSec', 0):.1f}s")
                    print(f"  Total: {result.get('totalSilenceSec', 0):.1f}s")

                    print(f"\nGenerated Files:")
                    print(f"  Lesson PDF: {result.get('lessonPdfPath', 'N/A')}")
                    print(f"  Advice PDF: {result.get('advicePdfPath', 'N/A')}")

                    advice_summary = result.get("adviceSummary", [])
                    if advice_summary:
                        print(f"\nAdvice (top 3):")
                        for adv in advice_summary:
                            print(f"  - {adv}")

                    advice_text = result.get("adviceText")
                    if advice_text:
                        snippet = advice_text.strip().splitlines()
                        preview = " ".join(snippet)[:240]
                        print(f"\nAdvice Text Preview:")
                        print(f"  {preview}...")

                    if result.get('transcriptText'):
                        text = result['transcriptText'][:200]
                        print(f"\nTranscription (first 200 chars):")
                        print(f"  {text}...")

                    print(f"\nAlerts: {len(result.get('alerts', []))}")
                    for alert in result.get('alerts', [])[:3]:
                        print(f"  - [{alert.get('severity')}] {alert.get('message')}")

                    return result

                elif status == "failed":
                    print(f"\n\nProcessing FAILED!")
                    print(f"  Error: {session.get('error', 'Unknown')}")
                    return None

        except requests.exceptions.ConnectionError:
            print(f"\r  Waiting for FastAPI server...", end="", flush=True)

        time.sleep(2)

    print(f"\n\nTimeout waiting for result")
    return None

# =============================================================================
# Main
# =============================================================================

def main():
    print("=" * 50)
    print("LEARNO AI - Microphone Test")
    print("=" * 50)

    # Check if FastAPI is running
    try:
        r = requests.get(f"{FASTAPI_URL}/health", timeout=2)
        print(f"FastAPI: Running at {FASTAPI_URL}")
    except:
        print(f"\nERROR: FastAPI not running at {FASTAPI_URL}")
        print("Start it with: python api.py")
        print("Or: uvicorn api:app --reload --port 8000")
        return

    # Record
    output_dir = os.path.dirname(os.path.abspath(__file__))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    audio_path = os.path.join(output_dir, f"test_recording_{timestamp}.wav")

    print("\nHow long to record?")
    print("  1. 30 seconds (quick test)")
    print("  2. 60 seconds")
    print("  3. Manual (press Ctrl+C to stop)")

    choice = input("\nChoice [1/2/3]: ").strip()

    if choice == "1":
        duration = 30
    elif choice == "2":
        duration = 60
    else:
        duration = None

    print("\nTIP: Speak as if you're a teacher giving a lesson.")
    print("     Include pauses, ask questions, etc.\n")
    input("Press Enter to start recording...")

    record_audio(audio_path, duration)

    # Upload
    session_id = f"mic_test_{timestamp}"
    result = upload_to_fastapi(audio_path, session_id)

    if result:
        # Wait for processing
        check_result(session_id)

    print("\n" + "=" * 50)
    print("Test complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
