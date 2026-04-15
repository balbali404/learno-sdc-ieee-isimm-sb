"""Audio metrics computation for speaker diarization analysis."""

import math
import numpy as np
import soundfile as sf
from collections import Counter
from typing import List, Dict, Any, Optional


def _safe_float(x, default=0.0):
    try:
        v = float(x)
        if math.isnan(v) or math.isinf(v):
            return default
        return v
    except Exception:
        return default


def _load_mono_audio(wav_file: str):
    audio_np, sr = sf.read(wav_file)
    audio_np = np.asarray(audio_np, dtype=np.float32)
    if audio_np.ndim > 1:
        audio_np = audio_np.mean(axis=1)
    return audio_np, sr


def _role_from_label(label: str, teacher_label: str) -> str:
    return "teacher" if label == teacher_label else "student"


def _iter_segments(diarization) -> List[Dict]:
    rows = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        rows.append({
            "speaker_label": speaker,
            "start": round(float(turn.start), 4),
            "end": round(float(turn.end), 4),
            "duration": round(float(turn.end - turn.start), 4),
        })
    return sorted(rows, key=lambda x: (x["start"], x["end"]))


def _segments_with_roles(diarization, teacher_label: str) -> List[Dict]:
    segments = _iter_segments(diarization)
    for seg in segments:
        seg["role"] = _role_from_label(seg["speaker_label"], teacher_label)
    return segments


def _merge_adjacent_same_role(segments: List[Dict], max_gap: float = 0.25) -> List[Dict]:
    if not segments:
        return []
    merged = [dict(segments[0])]
    for seg in segments[1:]:
        prev = merged[-1]
        same_role = seg["role"] == prev["role"]
        gap = seg["start"] - prev["end"]
        if same_role and gap <= max_gap:
            prev["end"] = max(prev["end"], seg["end"])
            prev["duration"] = round(prev["end"] - prev["start"], 4)
        else:
            merged.append(dict(seg))
    return merged


def _moving_average(x, win):
    x = np.asarray(x, dtype=np.float32)
    if len(x) == 0:
        return x
    win = max(1, int(win))
    kernel = np.ones(win, dtype=np.float32) / win
    return np.convolve(x, kernel, mode="same")


def _count_envelope_peaks(samples, sr, smooth_ms=35, min_peak_distance_ms=120):
    samples = np.asarray(samples, dtype=np.float32)
    if len(samples) < max(10, int(0.2 * sr)):
        return 0
    envelope = np.abs(samples)
    smooth_win = max(1, int(sr * smooth_ms / 1000.0))
    env = _moving_average(envelope, smooth_win)
    if len(env) < 3:
        return 0
    threshold = float(env.mean() + 0.5 * env.std())
    min_dist = max(1, int(sr * min_peak_distance_ms / 1000.0))
    peaks = 0
    last_idx = -min_dist
    for i in range(1, len(env) - 1):
        if env[i] > threshold and env[i] >= env[i - 1] and env[i] > env[i + 1]:
            if i - last_idx >= min_dist:
                peaks += 1
                last_idx = i
    return peaks


def compute_talk_ratios(diarization, teacher_label: str) -> Dict[str, Any]:
    """Compute teacher vs student speaking time."""
    teacher_time = student_time = 0.0
    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        dur = turn.end - turn.start
        role = "teacher" if speaker == teacher_label else "student"
        segments.append({
            "speaker": role,
            "start": round(turn.start, 2),
            "end": round(turn.end, 2),
            "duration": round(dur, 2),
        })
        if role == "teacher":
            teacher_time += dur
        else:
            student_time += dur
    total = (teacher_time + student_time) or 1
    return {
        "teacher_ratio": round(teacher_time / total, 2),
        "student_ratio": round(student_time / total, 2),
        "teacher_minutes": round(teacher_time / 60, 1),
        "student_minutes": round(student_time / 60, 1),
        "segments": segments,
    }


def detect_silence_gaps(segments: List[Dict], min_gap: float = 3.0) -> List[Dict]:
    """Detect silence gaps between speech segments."""
    if not segments:
        return []
    gaps, prev_end = [], 0.0
    for seg in sorted(segments, key=lambda x: x["start"]):
        gap = seg["start"] - prev_end
        if gap >= min_gap:
            gaps.append({
                "start": round(prev_end, 2),
                "end": round(seg["start"], 2),
                "duration": round(gap, 2),
            })
        prev_end = max(prev_end, seg["end"])
    return gaps


def compute_speaking_pace_proxy(wav_file: str, diarization, teacher_label: str, min_segment_sec: float = 0.8) -> Dict:
    """Estimate pace from smoothed energy-envelope peak density."""
    audio_np, sr = _load_mono_audio(wav_file)
    segments = _segments_with_roles(diarization, teacher_label)
    pace_rows = []

    for seg in segments:
        duration = seg["duration"]
        if duration < min_segment_sec:
            continue
        s = max(0, int(seg["start"] * sr))
        e = min(len(audio_np), int(seg["end"] * sr))
        chunk = audio_np[s:e]
        if len(chunk) == 0:
            continue

        peaks = _count_envelope_peaks(chunk, sr)
        pace_per_sec = peaks / max(duration, 1e-6)
        rms = float(np.sqrt(np.mean(np.square(chunk))) + 1e-12)
        voiced_density = float(np.mean(np.abs(chunk) > max(0.02, 0.5 * np.std(chunk))))

        if pace_per_sec >= 5.5:
            pace_band = "fast"
        elif pace_per_sec >= 3.0:
            pace_band = "medium"
        else:
            pace_band = "slow"

        pace_rows.append({
            "role": seg["role"],
            "speaker_label": seg["speaker_label"],
            "start": seg["start"],
            "end": seg["end"],
            "duration": round(duration, 2),
            "pace_proxy": round(pace_per_sec, 2),
            "pace_band": pace_band,
            "rms": round(rms, 4),
            "voiced_density": round(voiced_density, 3),
        })

    teacher_scores = [r["pace_proxy"] for r in pace_rows if r["role"] == "teacher"]
    student_scores = [r["pace_proxy"] for r in pace_rows if r["role"] == "student"]
    teacher_fast_ratio = float(np.mean([r["pace_band"] == "fast" for r in pace_rows if r["role"] == "teacher"])) if any(r["role"] == "teacher" for r in pace_rows) else 0.0

    return {
        "per_segment": pace_rows,
        "summary": {
            "teacher_avg_pace_proxy": round(float(np.mean(teacher_scores)), 2) if teacher_scores else 0.0,
            "student_avg_pace_proxy": round(float(np.mean(student_scores)), 2) if student_scores else 0.0,
            "teacher_fast_segment_ratio": round(teacher_fast_ratio, 2),
            "teacher_consistently_fast": teacher_fast_ratio >= 0.6 and len(teacher_scores) >= 2,
        },
    }


def detect_interruptions(diarization, teacher_label: str, min_overlap_sec: float = 0.15) -> Dict:
    """Detect overlap-based interruptions between speaker turns."""
    segments = _segments_with_roles(diarization, teacher_label)
    interruptions = []
    for i in range(1, len(segments)):
        prev_seg = segments[i - 1]
        cur_seg = segments[i]
        if cur_seg["speaker_label"] == prev_seg["speaker_label"]:
            continue
        overlap = prev_seg["end"] - cur_seg["start"]
        if overlap >= min_overlap_sec:
            interruptions.append({
                "interrupter_role": cur_seg["role"],
                "interrupted_role": prev_seg["role"],
                "interrupter_label": cur_seg["speaker_label"],
                "interrupted_label": prev_seg["speaker_label"],
                "start": round(cur_seg["start"], 2),
                "previous_end": round(prev_seg["end"], 2),
                "overlap_sec": round(overlap, 2),
                "type": f'{cur_seg["role"]}_interrupts_{prev_seg["role"]}',
            })

    counts = Counter(item["type"] for item in interruptions)
    return {
        "count": len(interruptions),
        "counts_by_type": dict(counts),
        "events": interruptions,
    }


def measure_wait_times(diarization, teacher_label: str, max_wait_sec: float = 10.0) -> Dict:
    """Measure delay between one role ending and another starting."""
    segments = _merge_adjacent_same_role(_segments_with_roles(diarization, teacher_label), max_gap=0.35)
    exchanges = []
    for i in range(1, len(segments)):
        prev_seg = segments[i - 1]
        cur_seg = segments[i]
        if prev_seg["role"] == cur_seg["role"]:
            continue
        wait_sec = cur_seg["start"] - prev_seg["end"]
        if wait_sec < 0 or wait_sec > max_wait_sec:
            continue
        exchanges.append({
            "from_role": prev_seg["role"],
            "to_role": cur_seg["role"],
            "from_end": round(prev_seg["end"], 2),
            "to_start": round(cur_seg["start"], 2),
            "wait_sec": round(wait_sec, 2),
            "short_wait": wait_sec < 1.0,
        })

    teacher_to_student = [x["wait_sec"] for x in exchanges if x["from_role"] == "teacher" and x["to_role"] == "student"]
    student_to_teacher = [x["wait_sec"] for x in exchanges if x["from_role"] == "student" and x["to_role"] == "teacher"]

    return {
        "exchanges": exchanges,
        "summary": {
            "avg_teacher_to_student_wait": round(float(np.mean(teacher_to_student)), 2) if teacher_to_student else 0.0,
            "avg_student_to_teacher_wait": round(float(np.mean(student_to_teacher)), 2) if student_to_teacher else 0.0,
            "teacher_to_student_count": len(teacher_to_student),
            "student_to_teacher_count": len(student_to_teacher),
            "teacher_short_wait_ratio": round(float(np.mean([w < 1.0 for w in teacher_to_student])), 2) if teacher_to_student else 0.0,
        },
    }


def analyze_turn_taking(diarization, teacher_label: str) -> Dict:
    """Analyze turn-taking patterns."""
    segments = _merge_adjacent_same_role(_segments_with_roles(diarization, teacher_label), max_gap=0.35)
    roles = [seg["role"] for seg in segments]
    compact = []
    for role in roles:
        marker = "T" if role == "teacher" else "S"
        if not compact or compact[-1] != marker:
            compact.append(marker)

    transitions = [f'{compact[i]}->{compact[i+1]}' for i in range(len(compact) - 1)]
    consecutive_teacher_turns = sum(1 for i in range(1, len(roles)) if roles[i] == "teacher" and roles[i - 1] == "teacher")

    teacher_turns = sum(role == "teacher" for role in roles)
    student_turns = sum(role == "student" for role in roles)

    return {
        "turn_sequence": "->".join(compact),
        "teacher_turns": teacher_turns,
        "student_turns": student_turns,
        "transition_counts": dict(Counter(transitions)),
        "teacher_to_teacher_ratio": round(consecutive_teacher_turns / max(len(roles) - 1, 1), 2),
        "balanced_dialogue": teacher_turns > 0 and student_turns > 0 and abs(teacher_turns - student_turns) / max(teacher_turns + student_turns, 1) <= 0.35,
        "merged_turns": segments,
    }


def analyze_energy_loudness(wav_file: str, diarization, teacher_label: str, min_segment_sec: float = 0.4) -> Dict:
    """Analyze energy/loudness per segment."""
    audio_np, sr = _load_mono_audio(wav_file)
    segments = _segments_with_roles(diarization, teacher_label)
    rows = []

    for seg in segments:
        if seg["duration"] < min_segment_sec:
            continue
        s = max(0, int(seg["start"] * sr))
        e = min(len(audio_np), int(seg["end"] * sr))
        chunk = audio_np[s:e]
        if len(chunk) == 0:
            continue

        rms = float(np.sqrt(np.mean(np.square(chunk))) + 1e-12)
        peak = float(np.max(np.abs(chunk))) if len(chunk) else 0.0
        dbfs = 20.0 * math.log10(max(rms, 1e-12))
        rows.append({
            "role": seg["role"],
            "speaker_label": seg["speaker_label"],
            "start": seg["start"],
            "end": seg["end"],
            "duration": round(seg["duration"], 2),
            "rms": round(rms, 5),
            "peak": round(peak, 5),
            "dbfs": round(dbfs, 2),
        })

    dbfs_vals = np.array([r["dbfs"] for r in rows], dtype=np.float32) if rows else np.array([], dtype=np.float32)
    mean_db = float(dbfs_vals.mean()) if len(dbfs_vals) else 0.0
    std_db = float(dbfs_vals.std()) if len(dbfs_vals) else 0.0

    low_energy = []
    high_energy = []
    for row in rows:
        z = (row["dbfs"] - mean_db) / std_db if std_db > 1e-9 else 0.0
        row["energy_zscore"] = round(float(z), 2)
        if z <= -1.0:
            low_energy.append(row)
        elif z >= 1.0:
            high_energy.append(row)

    teacher_db = [r["dbfs"] for r in rows if r["role"] == "teacher"]
    student_db = [r["dbfs"] for r in rows if r["role"] == "student"]

    return {
        "per_segment": rows,
        "summary": {
            "teacher_avg_dbfs": round(float(np.mean(teacher_db)), 2) if teacher_db else 0.0,
            "student_avg_dbfs": round(float(np.mean(student_db)), 2) if student_db else 0.0,
            "low_energy_zone_count": len(low_energy),
            "high_energy_zone_count": len(high_energy),
        },
        "low_energy_zones": low_energy,
        "high_energy_zones": high_energy,
    }


def detect_overlap_crosstalk(diarization, teacher_label: str, min_overlap_sec: float = 0.1) -> Dict:
    """Detect overlapping speech between speakers."""
    segments = _segments_with_roles(diarization, teacher_label)
    overlaps = []
    total_overlap = 0.0
    for i in range(len(segments)):
        a = segments[i]
        for j in range(i + 1, len(segments)):
            b = segments[j]
            if b["start"] >= a["end"]:
                break
            if a["speaker_label"] == b["speaker_label"]:
                continue
            start = max(a["start"], b["start"])
            end = min(a["end"], b["end"])
            dur = end - start
            if dur >= min_overlap_sec:
                total_overlap += dur
                roles = sorted([a["role"], b["role"]])
                overlap_type = f'{roles[0]}_{roles[1]}'
                overlaps.append({
                    "start": round(start, 2),
                    "end": round(end, 2),
                    "duration": round(dur, 2),
                    "speaker_a": a["speaker_label"],
                    "speaker_b": b["speaker_label"],
                    "role_a": a["role"],
                    "role_b": b["role"],
                    "type": overlap_type,
                })

    session_end = max((seg["end"] for seg in segments), default=0.0)
    return {
        "events": overlaps,
        "summary": {
            "overlap_event_count": len(overlaps),
            "overlap_total_sec": round(total_overlap, 2),
            "overlap_ratio": round(total_overlap / max(session_end, 1e-6), 3),
            "counts_by_type": dict(Counter(item["type"] for item in overlaps)),
        },
    }


def segment_session(diarization, teacher_label: str, silence_gaps: Optional[List] = None) -> Dict:
    """Segment session into phases based on speaker patterns."""
    turns = _merge_adjacent_same_role(_segments_with_roles(diarization, teacher_label), max_gap=0.35)
    if not turns:
        return {"phases": [], "summary": {"phase_count": 0}}

    session_end = turns[-1]["end"]
    cut_points = set([0.0, session_end])

    if silence_gaps:
        for gap in silence_gaps:
            if gap.get("duration", 0) >= 4.0:
                cut_points.add(round(gap["start"], 2))
                cut_points.add(round(gap["end"], 2))

    for i in range(1, len(turns)):
        if turns[i]["role"] != turns[i - 1]["role"]:
            if (turns[i]["start"] - turns[i - 1]["end"]) >= 2.0:
                cut_points.add(round(turns[i]["start"], 2))

    points = sorted(cut_points)
    phases = []
    for i in range(len(points) - 1):
        start, end = points[i], points[i + 1]
        if end - start < 1.0:
            continue
        phase_turns = [t for t in turns if t["start"] < end and t["end"] > start]
        if not phase_turns:
            continue

        teacher_time = student_time = 0.0
        switches = 0
        prev_role = None
        for t in phase_turns:
            overlap_start = max(start, t["start"])
            overlap_end = min(end, t["end"])
            dur = max(0.0, overlap_end - overlap_start)
            if t["role"] == "teacher":
                teacher_time += dur
            else:
                student_time += dur
            if prev_role is not None and t["role"] != prev_role:
                switches += 1
            prev_role = t["role"]

        phase_dur = end - start
        teacher_ratio = teacher_time / max(teacher_time + student_time, 1e-6)
        switch_density = switches / max(phase_dur / 60.0, 1e-6)

        if teacher_ratio >= 0.8 and switch_density < 4:
            label = "instruction"
        elif teacher_ratio <= 0.35 and switch_density >= 4:
            label = "student_activity"
        elif 0.35 < teacher_ratio < 0.8 and switch_density >= 4:
            label = "q_and_a"
        elif phase_dur < 20:
            label = "transition"
        else:
            label = "mixed"

        phases.append({
            "start": round(start, 2),
            "end": round(end, 2),
            "duration": round(phase_dur, 2),
            "label": label,
            "teacher_ratio": round(teacher_ratio, 2),
            "switch_density_per_min": round(switch_density, 2),
        })

    return {
        "phases": phases,
        "summary": {
            "phase_count": len(phases),
            "labels": dict(Counter(p["label"] for p in phases)),
        },
    }


def compute_engagement_score(ratios: Dict, wait_times: Dict, interruptions: Dict,
                            turn_taking: Dict, overlaps: Dict, silence_gaps: Optional[List] = None) -> Dict:
    """Compute 0-100 engagement score from audio interaction signals."""
    teacher_ratio = _safe_float(ratios.get("teacher_ratio", 0.0))
    balance_score = max(0.0, 1.0 - abs(teacher_ratio - 0.5) / 0.5)

    avg_wait = _safe_float(wait_times.get("summary", {}).get("avg_teacher_to_student_wait", 0.0))
    if avg_wait <= 0:
        wait_score = 0.4
    elif avg_wait <= 3.0:
        wait_score = 1.0
    elif avg_wait <= 6.0:
        wait_score = 0.7
    else:
        wait_score = 0.35

    interrupt_count = _safe_float(interruptions.get("count", 0.0))
    interruption_score = max(0.0, 1.0 - interrupt_count / 8.0)

    overlap_ratio = _safe_float(overlaps.get("summary", {}).get("overlap_ratio", 0.0))
    overlap_score = max(0.0, 1.0 - overlap_ratio / 0.2)

    teacher_tt_ratio = _safe_float(turn_taking.get("teacher_to_teacher_ratio", 1.0))
    turn_score = max(0.0, 1.0 - teacher_tt_ratio)

    longest_silence = max([_safe_float(g.get("duration", 0.0)) for g in (silence_gaps or [])], default=0.0)
    silence_score = max(0.0, 1.0 - longest_silence / 12.0)

    components = {
        "talk_balance": round(balance_score * 100, 1),
        "wait_time": round(wait_score * 100, 1),
        "interruptions": round(interruption_score * 100, 1),
        "overlap": round(overlap_score * 100, 1),
        "turn_taking": round(turn_score * 100, 1),
        "silence": round(silence_score * 100, 1),
    }
    weights = {
        "talk_balance": 0.25,
        "wait_time": 0.2,
        "interruptions": 0.15,
        "overlap": 0.1,
        "turn_taking": 0.2,
        "silence": 0.1,
    }
    score = sum(components[k] * weights[k] for k in components)

    if score >= 75:
        band = "high"
    elif score >= 50:
        band = "medium"
    else:
        band = "low"

    return {
        "score": round(score, 1),
        "band": band,
        "components": components,
    }


def run_advanced_audio_metrics(wav_file: str, diarization, teacher_label: str, ratios: Dict, gaps: List) -> Dict:
    """Run all advanced audio metrics."""
    pace = compute_speaking_pace_proxy(wav_file, diarization, teacher_label)
    interruptions = detect_interruptions(diarization, teacher_label)
    wait_times = measure_wait_times(diarization, teacher_label)
    turn_taking = analyze_turn_taking(diarization, teacher_label)
    loudness = analyze_energy_loudness(wav_file, diarization, teacher_label)
    overlaps = detect_overlap_crosstalk(diarization, teacher_label)
    session = segment_session(diarization, teacher_label, silence_gaps=gaps)
    engagement = compute_engagement_score(ratios, wait_times, interruptions, turn_taking, overlaps, silence_gaps=gaps)

    results = {
        "speaking_pace": pace,
        "interruptions": interruptions,
        "wait_times": wait_times,
        "turn_taking": turn_taking,
        "energy_loudness": loudness,
        "overlap_crosstalk": overlaps,
        "session_segmentation": session,
        "engagement_score": engagement,
    }

    print("Advanced audio metrics ready:")
    print(f"- Speaking pace rows      : {len(pace['per_segment'])}")
    print(f"- Interruptions           : {interruptions['count']}")
    print(f"- Wait-time exchanges     : {len(wait_times['exchanges'])}")
    print(f"- Turn sequence           : {turn_taking['turn_sequence'] or 'N/A'}")
    print(f"- Overlap events          : {overlaps['summary']['overlap_event_count']}")
    print(f"- Session phases          : {session['summary']['phase_count']}")
    print(f"- Engagement score        : {engagement['score']} ({engagement['band']})")
    return results
