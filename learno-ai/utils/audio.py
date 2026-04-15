"""Audio utility functions for loading and converting audio files."""

import os
import subprocess
import numpy as np
import soundfile as sf


def convert_to_wav_16k(input_file: str, output_file: str) -> str:
    """Convert any audio file to 16kHz mono WAV using ffmpeg."""
    result = subprocess.run(
        ["ffmpeg", "-i", input_file, "-ar", "16000", "-ac", "1",
         output_file, "-y", "-loglevel", "error"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg error:\n{result.stderr}")
    print(f"Converted -> {output_file}")
    return output_file


def load_mono_audio(wav_file: str) -> tuple:
    """Load audio file as mono float32 numpy array."""
    audio_np, sr = sf.read(wav_file)
    audio_np = np.asarray(audio_np, dtype=np.float32)
    if audio_np.ndim > 1:
        audio_np = audio_np.mean(axis=1)
    return audio_np, sr
