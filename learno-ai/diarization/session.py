"""Main session processing orchestration."""

import os
import time
import json
import subprocess
import numpy as np
import torch
import soundfile as sf
from collections import defaultdict

from .config import MIN_SILENCE_GAP, INTRO_DURATION
from .diarization import run_diarization
from .embeddings import extract_embedding, compute_cluster_embeddings
from .teacher_id import identify_teacher, map_speakers_to_roles, compute_rich_segments
from .metrics import compute_talk_ratios, detect_silence_gaps, run_advanced_audio_metrics


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


def extract_role_audio(diarization, role_mapping: dict, wav_file: str,
                       target_role: str = "teacher", out_path: str = "teacher_only.wav",
                       min_segment_sec: float = 0.5) -> str:
    """Extract audio for a specific role from diarization."""
    audio_np, sr = sf.read(wav_file)

    segments = []
    for turn, _, spk in diarization.itertracks(yield_label=True):
        role = role_mapping.get(spk, "unknown")
        if role != target_role:
            continue
        dur = float(turn.end - turn.start)
        if dur < min_segment_sec:
            continue
        segments.append((float(turn.start), float(turn.end)))

    if not segments:
        print(f"No segments for role={target_role}")
        return None

    fade_ms = 50
    silence_between_ms = 200
    fade_samples = int(fade_ms / 1000 * sr)
    silence_samples = int(silence_between_ms / 1000 * sr)

    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)

    chunks = []
    for (st, en) in segments:
        start_i = int(st * sr)
        end_i = int(en * sr)
        chunk = audio_np[start_i:end_i].copy()
        if len(chunk) > 2 * fade_samples:
            chunk[:fade_samples] *= fade_in
            chunk[-fade_samples:] *= fade_out
        chunks.append(chunk)

    silence = np.zeros(silence_samples)
    combined = chunks[0]
    for c in chunks[1:]:
        combined = np.concatenate([combined, silence, c])

    sf.write(out_path, combined, sr)
    print(f"Extracted {target_role}-only audio -> {out_path}")
    return out_path


def process_session(audio_path: str, intro_duration: float = None, save_json: bool = True) -> dict:
    """
    End-to-end processing of one session recording.

    Steps:
      1) Validate and prepare audio
      2) Run diarization
      3) Build intro_segments from the first intro_duration seconds
      4) Calibrate teacher_embedding from intro
      5) Identify TEACHER_LABEL for the full session
      6) Compute role mapping (teacher, student_1, ...)
      7) Compute rich segments & base ratios/silence
      8) Compute advanced metrics
      9) Extract recap audio
     10) Build and optionally save the final JSON result
    """
    from .pipeline import get_embedding_model

    if intro_duration is None:
        intro_duration = INTRO_DURATION

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    if intro_duration <= 0:
        raise ValueError("intro_duration must be > 0")

    audio_probe, probe_sr = sf.read(audio_path)
    duration = len(audio_probe) / probe_sr if probe_sr else 0.0
    print(f"> Processing session: {audio_path} ({duration:.1f}s @ {probe_sr} Hz)")

    session_dir = os.path.dirname(audio_path) or os.getcwd()
    session_stem = os.path.splitext(os.path.basename(audio_path))[0]
    prepared_wav = os.path.join(session_dir, f"{session_stem}_16k_mono.wav")

    needs_conversion = probe_sr != 16000 or np.asarray(audio_probe).ndim > 1
    if needs_conversion:
        print("Preparing audio to 16 kHz mono WAV for diarization...")
        wav_file = convert_to_wav_16k(audio_path, output_file=prepared_wav)
    else:
        wav_file = audio_path

    audio_np, sr = sf.read(wav_file)
    if np.asarray(audio_np).ndim > 1:
        audio_np = np.asarray(audio_np, dtype=np.float32).mean(axis=1)
    else:
        audio_np = np.asarray(audio_np, dtype=np.float32)

    # Guard against very short clips that break downstream CNN kernels
    min_duration_sec = 3.0
    min_samples = int(min_duration_sec * sr)
    if len(audio_np) < min_samples:
        pad = min_samples - len(audio_np)
        audio_np = np.pad(audio_np, (0, pad))
        sf.write(wav_file, audio_np, sr)
        print(f"Padded audio to {min_duration_sec:.1f}s to satisfy model kernel size (added {pad} samples)")

    duration = len(audio_np) / sr if sr else 0.0
    actual_intro = min(intro_duration, duration)
    print(f"Prepared audio: {wav_file} ({duration:.1f}s @ {sr} Hz)")
    print(f"Intro window requested: {intro_duration:.1f}s ({actual_intro:.1f}s available)")

    # Run diarization
    diarization = run_diarization(wav_file)

    # Build intro segments
    intro_segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        clipped_start = max(0.0, float(turn.start))
        clipped_end = min(float(turn.end), actual_intro)
        if clipped_end <= clipped_start:
            continue
        intro_segments.append({
            "speaker": speaker,
            "start": clipped_start,
            "end": clipped_end,
            "duration": clipped_end - clipped_start,
        })

    print(f"Intro segments found: {len(intro_segments)}")
    if not intro_segments:
        raise RuntimeError("No diarization segments overlap the intro window")

    # Find intro teacher candidate
    dur_per_spk = defaultdict(float)
    for seg in intro_segments:
        dur_per_spk[seg["speaker"]] += seg["duration"]

    intro_teacher_label = max(dur_per_spk, key=dur_per_spk.get)
    print(f"Intro teacher candidate: {intro_teacher_label}")

    # Get teacher segments for calibration
    teacher_intro_segs = [
        (seg["start"], seg["end"])
        for seg in intro_segments
        if seg["speaker"] == intro_teacher_label and seg["duration"] >= 1.5
    ]
    if len(teacher_intro_segs) < 3:
        teacher_intro_segs = [
            (seg["start"], seg["end"])
            for seg in intro_segments
            if seg["speaker"] == intro_teacher_label and seg["duration"] >= 0.8
        ]
    if len(teacher_intro_segs) < 3:
        teacher_intro_segs = [
            (seg["start"], seg["end"])
            for seg in sorted(intro_segments, key=lambda s: s["duration"], reverse=True)
            if seg["speaker"] == intro_teacher_label
        ]
    teacher_intro_segs = teacher_intro_segs[:5]

    if not teacher_intro_segs:
        raise RuntimeError("No suitable teacher segments in intro for calibration")

    # Extract embeddings
    embs = [extract_embedding(wav_file, start_sec, end_sec) for start_sec, end_sec in teacher_intro_segs]
    emb_tensors = []
    for emb in embs:
        if isinstance(emb, np.ndarray):
            emb = torch.from_numpy(emb)
        elif not isinstance(emb, torch.Tensor):
            raise TypeError(f"Unexpected embedding type: {type(emb)}")
        emb = emb.float()
        emb_tensors.append(emb.squeeze())

    teacher_embedding = torch.stack(emb_tensors).mean(dim=0)
    teacher_embedding = teacher_embedding / teacher_embedding.norm(p=2).clamp_min(1e-12)
    print(f"Calibrated teacher embedding from {len(emb_tensors)} segment(s)")

    # Identify teacher for full session
    teacher_label = identify_teacher(diarization, wav_file, teacher_embedding)

    # Compute cluster embeddings and role mapping
    cluster_embeddings = compute_cluster_embeddings(diarization, wav_file)
    if not cluster_embeddings:
        raise RuntimeError("Could not compute cluster embeddings for any diarized speaker")

    role_mapping, cluster_scores, sim_threshold = map_speakers_to_roles(
        cluster_embeddings, teacher_embedding, teacher_label
    )
    rich = compute_rich_segments(diarization, role_mapping)

    # Compute metrics
    ratios = compute_talk_ratios(diarization, teacher_label)
    gaps = detect_silence_gaps(ratios["segments"], min_gap=MIN_SILENCE_GAP)
    advanced_audio_metrics = run_advanced_audio_metrics(
        wav_file, diarization, teacher_label, ratios, gaps
    )

    # Extract teacher recap audio
    teacher_recap_path = os.path.join(session_dir, f"{session_stem}_teacher_recap.wav")
    teacher_recap_path = extract_role_audio(
        diarization, role_mapping, wav_file,
        target_role="teacher", out_path=teacher_recap_path
    )

    # Build output
    final_output = {
        "timestamp": time.time(),
        "audio_file": audio_path,
        "prepared_wav_file": wav_file,
        "teacher_label": teacher_label,
        "teacher_ratio": ratios["teacher_ratio"],
        "student_ratio": ratios["student_ratio"],
        "teacher_minutes": ratios["teacher_minutes"],
        "student_minutes": ratios["student_minutes"],
        "silence_gaps": gaps,
        "alert_flags": {
            "teacher_dominating": ratios["teacher_ratio"] > 0.85,
            "long_silence_found": len(gaps) > 0,
            "longest_silence_sec": max((gap["duration"] for gap in gaps), default=0),
        },
        "segments": rich["segments"],
        "advanced_metrics": {
            "engagement_score": advanced_audio_metrics["engagement_score"],
            "turn_taking": advanced_audio_metrics["turn_taking"],
            "wait_times": advanced_audio_metrics["wait_times"]["summary"],
            "interruptions": advanced_audio_metrics["interruptions"]["counts_by_type"],
            "session_phases": advanced_audio_metrics["session_segmentation"]["summary"],
            "speaking_pace": advanced_audio_metrics["speaking_pace"]["summary"],
            "energy": advanced_audio_metrics["energy_loudness"]["summary"],
            "overlap": advanced_audio_metrics["overlap_crosstalk"]["summary"],
        },
        "role_mapping": role_mapping,
        "cluster_scores": cluster_scores,
        "similarity_threshold": sim_threshold,
        "rich_segments": rich["segments"],
        "teacher_recap_path": teacher_recap_path,
    }

    # Save JSON
    json_path = os.path.join(session_dir, f"{session_stem}_learno_session.json")
    if save_json:
        with open(json_path, "w", encoding="utf-8") as fh:
            json.dump(final_output, fh, indent=2)
        print(f"Saved session JSON -> {json_path}")

    return {
        "diarization": diarization,
        "teacher_embedding": teacher_embedding,
        "teacher_label": teacher_label,
        "role_mapping": role_mapping,
        "rich": rich,
        "advanced": advanced_audio_metrics,
        "json": final_output,
        "json_path": json_path if save_json else None,
        "teacher_recap_path": teacher_recap_path,
        "intro_segments": intro_segments,
        "wav_file": wav_file,
    }
