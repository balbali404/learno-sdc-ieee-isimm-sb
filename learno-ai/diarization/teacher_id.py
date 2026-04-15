"""Teacher identification and role mapping."""

import numpy as np
import torch
import torch.nn.functional as F
import soundfile as sf
from .pipeline import get_embedding_model
from .embeddings import MIN_EMB_SAMPLES


def identify_teacher(diarization, wav_file: str, teacher_embedding=None) -> str:
    """Identify the teacher speaker label from diarization."""
    embedding_model = get_embedding_model()

    if teacher_embedding is None:
        # Fallback: pick most-speaking label
        times = {}
        for turn, _, spk in diarization.itertracks(yield_label=True):
            times[spk] = times.get(spk, 0) + (turn.end - turn.start)
        return max(times, key=times.get)

    audio_np, sr = sf.read(wav_file)
    best_match, best_score = None, -1.0
    scores = {}

    for speaker in diarization.labels():
        segments = diarization.label_timeline(speaker)
        if not segments:
            continue

        longest = max(segments, key=lambda s: s.duration)
        s_np = audio_np[int(longest.start * sr):int(longest.end * sr)]
        if len(s_np) == 0:
            continue

        try:
            if len(s_np) < MIN_EMB_SAMPLES:
                s_np = np.pad(s_np, (0, MIN_EMB_SAMPLES - len(s_np)))
            s_wav = torch.tensor(s_np).float().unsqueeze(0)
            emb = embedding_model({"waveform": s_wav, "sample_rate": sr})

            t_emb = torch.tensor(teacher_embedding).squeeze()
            s_emb = torch.tensor(emb).squeeze()
            if t_emb.dim() == 0 or s_emb.dim() == 0:
                continue

            score = F.cosine_similarity(
                t_emb.unsqueeze(0),
                s_emb.unsqueeze(0)
            ).item()

            scores[speaker] = round(score, 3)
            if score > best_score:
                best_score, best_match = score, speaker
        except Exception as e:
            print(f"Could not embed {speaker}: {e}")

    print("Similarity scores vs teacher:")
    for spk, sc in scores.items():
        tag = " TEACHER" if spk == best_match else ""
        print(f"  {spk}: {sc}{tag}")
    return best_match


def map_speakers_to_roles(cluster_embs: dict, teacher_embedding, teacher_label: str, threshold=None) -> tuple:
    """Map each speaker label to a role (teacher, student_1, etc.)."""
    scores = {}
    t_emb = teacher_embedding.squeeze()

    for spk, emb in cluster_embs.items():
        s_emb = emb.squeeze()
        score = F.cosine_similarity(
            t_emb.unsqueeze(0),
            s_emb.unsqueeze(0)
        ).item()
        scores[spk] = score

    print("Cluster-level similarities to teacher:")
    for spk, sc in scores.items():
        tag = " <- best" if spk == teacher_label else ""
        print(f"  {spk}: {sc:.3f}{tag}")

    if threshold is None:
        best_score = scores.get(teacher_label, max(scores.values()))
        threshold = best_score - 0.05
        print(f"Using similarity threshold={threshold:.3f}")

    mapping = {teacher_label: "teacher"}
    student_idx = 1
    for spk in cluster_embs.keys():
        if spk == teacher_label:
            continue
        mapping[spk] = f"student_{student_idx}"
        student_idx += 1

    print("Role mapping:")
    for spk, role in mapping.items():
        print(f"  {spk} -> {role}")

    return mapping, scores, threshold


def compute_rich_segments(diarization, role_mapping: dict) -> dict:
    """Build segments with roles and compute talk time per role."""
    segments = []
    time_per_role = {}

    for turn, _, spk in diarization.itertracks(yield_label=True):
        role = role_mapping.get(spk, "unknown")
        dur = float(turn.end - turn.start)

        seg = {
            "raw_speaker": spk,
            "role": role,
            "start": round(float(turn.start), 2),
            "end": round(float(turn.end), 2),
            "duration": round(dur, 2),
        }
        segments.append(seg)
        time_per_role[role] = time_per_role.get(role, 0.0) + dur

    total = sum(time_per_role.values()) or 1.0

    return {
        "per_role_minutes": {
            role: round(sec / 60.0, 1) for role, sec in time_per_role.items()
        },
        "per_role_ratio": {
            role: round(sec / total, 2) for role, sec in time_per_role.items()
        },
        "segments": segments,
    }
