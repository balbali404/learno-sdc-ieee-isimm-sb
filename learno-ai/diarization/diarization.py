"""Core diarization functionality."""

import numpy as np
import soundfile as sf
import torch
from pyannote.core import Annotation
from .pipeline import get_pipeline

# Minimum audio duration required for pyannote (in seconds)
# pyannote's CNN kernels require at least ~0.5s of audio to avoid pooling errors
MIN_AUDIO_DURATION_SEC = 1.0


def run_diarization(wav_file: str) -> Annotation:
    """Run speaker diarization on a WAV file.
    
    Raises:
        ValueError: If audio is too short for diarization
        RuntimeError: If diarization fails
    """
    # Check minimum audio duration to avoid max_pool1d errors
    audio_np, sr = sf.read(wav_file)
    duration = len(audio_np) / sr if sr else 0.0
    
    if duration < MIN_AUDIO_DURATION_SEC:
        raise ValueError(
            f"Audio too short for diarization: {duration:.2f}s "
            f"(minimum: {MIN_AUDIO_DURATION_SEC}s). "
            "Please provide a longer audio recording."
        )
    
    try:
        pipeline = get_pipeline()

        # Avoid pyannote's optional file-decoding path and pass the waveform
        # directly. This makes diarization independent from torchcodec/FFmpeg
        # shared-library availability on Windows.
        audio_np = np.asarray(audio_np, dtype=np.float32)
        if audio_np.ndim > 1:
            audio_np = audio_np.mean(axis=1)
        waveform = torch.from_numpy(audio_np).unsqueeze(0)

        diar_output = pipeline({"waveform": waveform, "sample_rate": sr})
    except RuntimeError as e:
        error_msg = str(e)
        if "max_pool1d" in error_msg or "Invalid computed output size" in error_msg:
            raise ValueError(
                f"Audio too short or corrupted for diarization ({duration:.2f}s). "
                "Please provide a longer audio recording (at least 3 seconds)."
            ) from e
        raise

    # Handle direct Annotation result
    if isinstance(diar_output, Annotation):
        return diar_output

    # Handle DiarizeOutput - check speaker_diarization attribute first
    if hasattr(diar_output, 'speaker_diarization'):
        return diar_output.speaker_diarization

    # Try annotation attribute
    if hasattr(diar_output, 'annotation'):
        annotation = diar_output.annotation
        if hasattr(annotation, 'itertracks'):
            return annotation

    # Try index access for NamedTuple (annotation is first element)
    try:
        first_elem = diar_output[0]
        if hasattr(first_elem, 'itertracks'):
            return first_elem
    except (TypeError, IndexError, KeyError):
        pass

    # Check if the output itself has itertracks (duck typing)
    if hasattr(diar_output, 'itertracks'):
        return diar_output

    # Last resort: try to_annotation method
    if hasattr(diar_output, 'to_annotation'):
        return diar_output.to_annotation()

    raise TypeError(f"Unknown diarization output type: {type(diar_output)}")


def iter_segments(diarization: Annotation) -> list:
    """Convert diarization to a list of segment dictionaries."""
    rows = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        rows.append({
            "speaker_label": speaker,
            "start": round(float(turn.start), 4),
            "end": round(float(turn.end), 4),
            "duration": round(float(turn.end - turn.start), 4),
        })
    return sorted(rows, key=lambda x: (x["start"], x["end"]))
