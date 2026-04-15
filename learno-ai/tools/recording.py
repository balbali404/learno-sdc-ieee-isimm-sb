"""Local audio recording utilities."""

import os
from typing import Optional

import soundfile as sf

try:
    import sounddevice as sd
except ImportError:
    sd = None


DEFAULT_RECORD_DURATION = 60
DEFAULT_RECORD_SR = 16000
DEFAULT_RECORD_OUTPUT = "live_recording.wav"


def record_local(
    duration_sec: int = DEFAULT_RECORD_DURATION,
    out_path: str = DEFAULT_RECORD_OUTPUT,
    sr: int = DEFAULT_RECORD_SR,
) -> str:
    """Record mono audio from the local microphone and save it as WAV."""
    if sd is None:
        raise RuntimeError("sounddevice is required for local recording. Install it with: pip install sounddevice")
    if duration_sec <= 0:
        raise ValueError("duration_sec must be > 0")
    if sr <= 0:
        raise ValueError("sr must be > 0")

    print(f"Recording for {duration_sec}s at {sr} Hz...")
    audio = sd.rec(
        int(duration_sec * sr),
        samplerate=sr,
        channels=1,
        dtype="float32",
    )
    sd.wait()

    audio = audio.squeeze()
    output_dir = os.path.dirname(out_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    sf.write(out_path, audio, sr)
    print(f"Saved recording -> {out_path}")
    return out_path
