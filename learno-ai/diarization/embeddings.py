"""Speaker embedding extraction and clustering."""

import numpy as np
import torch
import soundfile as sf
from .pipeline import get_embedding_model

# Minimum samples for embedding extraction at 16kHz
# pyannote embedding model needs at least ~0.5s to avoid conv kernel errors
MIN_EMB_SAMPLES = 8000  # 0.5s at 16kHz (was 400 = 25ms, too short)
MIN_EMB_DURATION_SEC = 0.5


def extract_embedding(wav_file: str, start_sec: float, end_sec: float) -> torch.Tensor:
    """Extract speaker embedding from a WAV time slice."""
    embedding_model = get_embedding_model()
    audio_np, sr = sf.read(wav_file)
    start = int(start_sec * sr)
    end = int(end_sec * sr)
    if end <= start:
        raise ValueError(f"Invalid segment window: start={start_sec}, end={end_sec}")

    segment_np = np.asarray(audio_np[start:end], dtype=np.float32)
    if len(segment_np) < MIN_EMB_SAMPLES:
        segment_np = np.pad(segment_np, (0, MIN_EMB_SAMPLES - len(segment_np)))

    segment = torch.tensor(segment_np).float().unsqueeze(0)
    
    try:
        emb = embedding_model({"waveform": segment, "sample_rate": sr})
        if isinstance(emb, np.ndarray):
            emb = torch.from_numpy(emb)
        return emb
    except RuntimeError as e:
        if "max_pool1d" in str(e) or "Invalid computed output size" in str(e):
            raise ValueError(
                f"Audio segment too short for embedding extraction "
                f"({end_sec - start_sec:.2f}s). Minimum required: {MIN_EMB_DURATION_SEC}s"
            ) from e
        raise


def compute_cluster_embeddings(diarization, wav_file: str) -> dict:
    """Compute one embedding per speaker by averaging over longest segments."""
    embedding_model = get_embedding_model()
    audio_np, sr = sf.read(wav_file)
    cluster_embs = {}

    for speaker in diarization.labels():
        segments = diarization.label_timeline(speaker)
        if not segments:
            continue

        segs_sorted = sorted(segments, key=lambda s: s.duration, reverse=True)
        top_segs = segs_sorted[:3]

        embs = []
        for seg in top_segs:
            start, end = float(seg.start), float(seg.end)
            start_i = int(start * sr)
            end_i = int(end * sr)
            s_np = audio_np[start_i:end_i]
            if len(s_np) < MIN_EMB_SAMPLES:
                # Pad short segments instead of skipping
                s_np = np.pad(s_np, (0, MIN_EMB_SAMPLES - len(s_np)))
            s_wav = torch.tensor(s_np).float().unsqueeze(0)

            try:
                emb = embedding_model({"waveform": s_wav, "sample_rate": sr})
                if isinstance(emb, np.ndarray):
                    emb = torch.from_numpy(emb)
                emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
                embs.append(emb)
            except RuntimeError as e:
                # Skip segments that cause pooling errors
                if "max_pool1d" in str(e) or "Invalid computed output size" in str(e):
                    print(f"⚠️ Skipping short segment for {speaker}: {end - start:.2f}s")
                    continue
                raise

        if not embs:
            continue

        spk_emb = torch.stack(embs).mean(dim=0)
        spk_emb = spk_emb / spk_emb.norm(p=2, dim=-1, keepdim=True)
        cluster_embs[speaker] = spk_emb

    return cluster_embs
