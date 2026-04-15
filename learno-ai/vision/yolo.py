"""YOLO vision model helpers for classroom video analysis."""

import importlib.util
import json
import math
import os
import shutil
import sys
import tempfile
from collections import Counter
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

import cv2

_vision_model = None
_loaded_model_path: Optional[str] = None

SMART_OPTION_OFF = "off"
SMART_OPTION_SUMMARY = "summary"
SMART_OPTION_ENHANCED = "enhanced"
SMART_OPTION_AUTO = "auto"


def _safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback

    if math.isnan(number) or math.isinf(number):
        return fallback
    return number


def _resolve_smart_option(smart_option: Optional[str]) -> str:
    candidate = (
        smart_option
        or os.getenv("VISION_SMART_OPTION")
        or SMART_OPTION_ENHANCED
    )
    normalized = str(candidate).strip().lower()

    if normalized == SMART_OPTION_AUTO:
        return SMART_OPTION_SUMMARY
    if normalized in {SMART_OPTION_OFF, SMART_OPTION_SUMMARY, SMART_OPTION_ENHANCED}:
        return normalized
    return SMART_OPTION_SUMMARY


def _is_on_task_label(label: str) -> bool:
    lowered = label.lower()
    on_task_markers = (
        "attentive",
        "raised",
        "on_task",
        "on-task",
        "writing",
        "reading",
        "focus",
        "engaged",
    )
    return any(marker in lowered for marker in on_task_markers)


def _is_off_task_label(label: str) -> bool:
    lowered = label.lower()
    off_task_markers = (
        "off_task",
        "off-task",
        "sleep",
        "phone",
        "restless",
        "fidget",
        "distract",
    )
    return any(marker in lowered for marker in off_task_markers)


def _build_smart_summary(
    frame_events: list,
    detection_totals: Counter,
    processed_frames: int,
    frames_with_detections: int,
) -> Dict[str, Any]:
    per_frame_counts = []
    for event in frame_events:
        counts = event.get("counts") if isinstance(event, dict) else None
        if isinstance(counts, dict):
            per_frame_counts.append(sum(int(v) for v in counts.values()))

    visible_peak = max(per_frame_counts) if per_frame_counts else 0
    visible_average = (
        round(sum(per_frame_counts) / len(per_frame_counts), 2)
        if per_frame_counts
        else 0.0
    )

    total_detections = int(sum(detection_totals.values()))
    detection_coverage = (
        round(frames_with_detections / processed_frames, 4)
        if processed_frames > 0
        else 0.0
    )

    on_task_total = 0
    off_task_total = 0
    for label, count in detection_totals.items():
        if _is_on_task_label(label):
            on_task_total += int(count)
        elif _is_off_task_label(label):
            off_task_total += int(count)

    normalized_total = max(on_task_total + off_task_total, 1)
    on_task_ratio = round(on_task_total / normalized_total, 4)
    off_task_ratio = round(off_task_total / normalized_total, 4)

    dominant_state = None
    if detection_totals:
        dominant_state = detection_totals.most_common(1)[0][0]

    return {
        "estimatedStudentsPeak": visible_peak,
        "estimatedStudentsAverage": visible_average,
        "detectionCoverage": detection_coverage,
        "totalDetections": total_detections,
        "stateDiversity": len(detection_totals),
        "dominantState": dominant_state,
        "onTaskRatio": on_task_ratio,
        "offTaskRatio": off_task_ratio,
    }


def _parse_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _parse_layout_env(name: str, default: Tuple[int, int]) -> Tuple[int, int]:
    raw = os.getenv(name)
    if not raw:
        return default

    parts = [part.strip() for part in raw.split(",")]
    if len(parts) != 2:
        return default

    try:
        rows = int(parts[0])
        cols = int(parts[1])
    except ValueError:
        return default

    if rows < 1 or cols < 1:
        return default
    return rows, cols


def _extract_enhanced_summary(report: Dict[str, Any]) -> Dict[str, Any]:
    overall = report.get("overall_engagement") if isinstance(report, dict) else {}
    if not isinstance(overall, dict):
        overall = {}

    per_student = report.get("per_student_engagement") if isinstance(report, dict) else {}
    if not isinstance(per_student, dict):
        per_student = {}

    low_engagement_students = []
    students = []
    improving = 0
    declining = 0

    for student_id, payload in per_student.items():
        if not isinstance(payload, dict):
            continue

        mean_caes = _safe_float(payload.get("mean_caes"), fallback=0.0)
        if mean_caes < 0.35:
            low_engagement_students.append(str(student_id))

        trend = str(payload.get("trend", "")).lower()
        if trend == "improving":
            improving += 1
        elif trend == "declining":
            declining += 1

        students.append({
            "detectedStudentId": str(student_id),
            "meanCaes": round(mean_caes, 4),
            "minCaes": round(mean_caes, 4),
            "maxCaes": round(mean_caes, 4),
            "trend": trend or "stable",
            "framesAnalyzed": int(_safe_float(payload.get("frames_analyzed"), fallback=0.0)),
            "lowEngagement": mean_caes < 0.35,
        })

    insights = report.get("insights") if isinstance(report, dict) else []
    if not isinstance(insights, list):
        insights = []

    return {
        "meanCAES": round(_safe_float(overall.get("mean_caes"), fallback=0.0), 4),
        "stdCAES": round(_safe_float(overall.get("std_caes"), fallback=0.0), 4),
        "minCAES": round(_safe_float(overall.get("min_caes"), fallback=0.0), 4),
        "maxCAES": round(_safe_float(overall.get("max_caes"), fallback=0.0), 4),
        "studentCount": len(per_student),
        "lowEngagementStudents": low_engagement_students,
        "improvingStudents": improving,
        "decliningStudents": declining,
        "students": students,
        "insights": insights[:5],
    }


def _run_enhanced_student_tracking(
    video_path: str,
    model_path: Optional[str],
    fps: float,
    output_json_path: Optional[str],
    smart_summary: Dict[str, Any],
) -> Dict[str, Any]:
    enhancement_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "yolo vision enhacment")
    )
    integration_path = os.path.join(enhancement_dir, "integration_guide.py")

    if not os.path.exists(integration_path):
        return {
            "enabled": False,
            "reason": "integration_guide.py not found in vision enhancement folder",
        }

    spec = importlib.util.spec_from_file_location(
        "learno_vision_integration_guide",
        integration_path,
    )
    if spec is None or spec.loader is None:
        return {
            "enabled": False,
            "reason": "Failed to load vision enhancement integration module",
        }

    added_to_path = False
    if enhancement_dir not in sys.path:
        sys.path.insert(0, enhancement_dir)
        added_to_path = True

    try:
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    except Exception as exc:
        return {
            "enabled": False,
            "reason": f"Vision enhancement import error: {exc}",
        }
    finally:
        if added_to_path:
            try:
                sys.path.remove(enhancement_dir)
            except ValueError:
                pass

    analyzer_class = getattr(module, "LearnoVideoAnalyzer", None)
    if analyzer_class is None:
        return {
            "enabled": False,
            "reason": "LearnoVideoAnalyzer is missing in integration module",
        }

    requested_students = _parse_int_env("VISION_SMART_STUDENT_COUNT", 0)
    estimated_students = int(smart_summary.get("estimatedStudentsPeak") or 0)
    student_count = max(requested_students, estimated_students, 1)

    classroom_layout = _parse_layout_env("VISION_SMART_CLASSROOM_LAYOUT", (3, 8))
    smart_fps = max(1, int(round(_safe_float(fps, fallback=30.0))))

    smart_output_json = None
    if output_json_path:
        stem, _ = os.path.splitext(os.path.abspath(output_json_path))
        smart_output_json = f"{stem}_smart.json"

    try:
        analyzer = analyzer_class(
            model_path=_resolve_model_path(model_path),
            num_students=student_count,
            classroom_dims=classroom_layout,
            fps=smart_fps,
        )
        report = analyzer.process_video(video_path=video_path, output_json=smart_output_json)
        summary = _extract_enhanced_summary(report if isinstance(report, dict) else {})
        return {
            "enabled": True,
            "studentCount": student_count,
            "classroomLayout": {
                "rows": classroom_layout[0],
                "cols": classroom_layout[1],
            },
            "reportPath": smart_output_json if smart_output_json and os.path.exists(smart_output_json) else None,
            "summary": summary,
        }
    except Exception as exc:
        return {
            "enabled": False,
            "reason": f"Vision enhancement runtime error: {exc}",
        }


def _default_model_path() -> str:
    env_path = os.getenv("VISION_MODEL_PATH")
    if env_path:
        return os.path.abspath(env_path)
    return os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "models", "mymodel6.pt")
    )


def _resolve_model_path(model_path: Optional[str] = None) -> str:
    return os.path.abspath(model_path or _default_model_path())


def _resolve_label(names: Any, cls_id: int) -> str:
    if isinstance(names, dict):
        value = names.get(cls_id)
        return str(value) if value is not None else str(cls_id)
    if isinstance(names, list) and 0 <= cls_id < len(names):
        return str(names[cls_id])
    return str(cls_id)


def get_vision_model(model_path: Optional[str] = None):
    """Return cached YOLO model instance, loading when needed."""
    global _vision_model, _loaded_model_path

    resolved_path = _resolve_model_path(model_path)
    if not os.path.exists(resolved_path):
        raise FileNotFoundError(f"Vision model not found: {resolved_path}")

    if _vision_model is not None and _loaded_model_path == resolved_path:
        return _vision_model

    try:
        from ultralytics import YOLO
    except Exception as exc:
        raise RuntimeError(
            "ultralytics is required for YOLO vision analysis. "
            "Install it with: pip install ultralytics"
        ) from exc

    print(f"Loading YOLO vision model from {resolved_path} ...")
    _vision_model = YOLO(resolved_path)
    _loaded_model_path = resolved_path
    print("YOLO vision model loaded")
    return _vision_model


def preload_vision_model(model_path: Optional[str] = None):
    """Warm up the YOLO model at startup."""
    print("=" * 50)
    print("PRELOADING YOLO VISION MODEL...")
    print("=" * 50)
    get_vision_model(model_path)
    print("=" * 50)
    print("YOLO VISION MODEL READY")
    print("=" * 50)


def is_vision_loaded(model_path: Optional[str] = None) -> bool:
    """Check if vision model is already loaded."""
    resolved_path = _resolve_model_path(model_path)
    return _vision_model is not None and _loaded_model_path == resolved_path


def get_vision_model_info() -> Dict[str, Any]:
    """Return runtime info about the current vision model."""
    names = {}
    if _vision_model is not None:
        names = getattr(_vision_model, "names", {}) or {}

    return {
        "loaded": _vision_model is not None,
        "model_path": _loaded_model_path or _default_model_path(),
        "class_count": len(names) if isinstance(names, (dict, list)) else 0,
    }


def analyze_video_file(
    video_path: str,
    output_json_path: Optional[str] = None,
    output_annotated_video_path: Optional[str] = None,
    frame_stride: int = 5,
    conf_threshold: float = 0.25,
    max_frames: Optional[int] = None,
    model_path: Optional[str] = None,
    smart_option: Optional[str] = None,
) -> Dict[str, Any]:
    """Run YOLO analysis over a video file and return aggregate detections."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if frame_stride < 1:
        frame_stride = 1

    model = get_vision_model(model_path)

    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        raise RuntimeError(f"Failed to open video: {video_path}")

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
    estimated_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    capture.release()

    total_frames = 0
    processed_frames = 0
    frames_with_detections = 0
    detection_totals: Counter = Counter()
    frame_events = []

    annotated_output_abs: Optional[str] = None
    temp_project_dir: Optional[str] = None
    save_dir: Optional[str] = None
    if output_annotated_video_path:
        annotated_output_abs = os.path.abspath(output_annotated_video_path)
        annotated_dir = os.path.dirname(annotated_output_abs) or os.getcwd()
        os.makedirs(annotated_dir, exist_ok=True)
        temp_project_dir = tempfile.mkdtemp(prefix="vision_annot_", dir=annotated_dir)

    predict_kwargs: Dict[str, Any] = {
        "source": video_path,
        "stream": True,
        "conf": conf_threshold,
        "imgsz": 640,
        "verbose": False,
        "save": annotated_output_abs is not None,
    }
    if temp_project_dir:
        predict_kwargs["project"] = temp_project_dir
        predict_kwargs["name"] = "annotated"
        predict_kwargs["exist_ok"] = True

    results_stream = model.predict(**predict_kwargs)

    for frame_index, pred in enumerate(results_stream, start=1):
        total_frames = frame_index
        if save_dir is None:
            pred_save_dir = getattr(pred, "save_dir", None)
            if pred_save_dir:
                save_dir = str(pred_save_dir)

        if (frame_index - 1) % frame_stride != 0:
            continue

        processed_frames += 1
        boxes = getattr(pred, "boxes", None)
        class_ids = boxes.cls.tolist() if boxes is not None and boxes.cls is not None else []
        confidences = boxes.conf.tolist() if boxes is not None and boxes.conf is not None else []
        names = getattr(pred, "names", {})

        frame_counts: Dict[str, int] = {}
        for idx, raw_cls in enumerate(class_ids):
            confidence = float(confidences[idx]) if idx < len(confidences) else 1.0
            if confidence < conf_threshold:
                continue

            cls_id = int(raw_cls)
            label = _resolve_label(names, cls_id)
            frame_counts[label] = frame_counts.get(label, 0) + 1
            detection_totals[label] += 1

        if frame_counts:
            frames_with_detections += 1
            timestamp_sec = round((frame_index - 1) / fps, 2) if fps > 0 else None
            frame_events.append(
                {
                    "frame": frame_index,
                    "timestampSec": timestamp_sec,
                    "counts": frame_counts,
                }
            )

        if max_frames is not None and processed_frames >= max_frames:
            break

    if annotated_output_abs and save_dir:
        source_annotated = os.path.join(save_dir, os.path.basename(video_path))
        if not os.path.exists(source_annotated):
            for name in os.listdir(save_dir):
                ext = os.path.splitext(name)[1].lower()
                if ext in {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"}:
                    source_annotated = os.path.join(save_dir, name)
                    break

        if os.path.exists(source_annotated):
            try:
                shutil.move(source_annotated, annotated_output_abs)
            except Exception:
                shutil.copy2(source_annotated, annotated_output_abs)

    if temp_project_dir:
        shutil.rmtree(temp_project_dir, ignore_errors=True)

    sorted_totals = dict(
        sorted(detection_totals.items(), key=lambda item: item[1], reverse=True)
    )

    resolved_smart_option = _resolve_smart_option(smart_option)
    smart_summary = _build_smart_summary(
        frame_events=frame_events,
        detection_totals=detection_totals,
        processed_frames=processed_frames,
        frames_with_detections=frames_with_detections,
    )
    smart_payload: Dict[str, Any] = {
        "mode": resolved_smart_option,
        "summary": smart_summary,
    }

    if resolved_smart_option == SMART_OPTION_ENHANCED:
        smart_payload["enhancement"] = _run_enhanced_student_tracking(
            video_path=video_path,
            model_path=model_path,
            fps=fps,
            output_json_path=output_json_path,
            smart_summary=smart_summary,
        )

    result = {
        "createdAt": datetime.utcnow().isoformat(),
        "model": {
            "path": _loaded_model_path or _resolve_model_path(model_path),
            "confidenceThreshold": conf_threshold,
        },
        "video": {
            "path": os.path.abspath(video_path),
            "fps": fps,
            "estimatedFrameCount": estimated_frames,
            "totalFramesRead": total_frames,
            "processedFrames": processed_frames,
            "frameStride": frame_stride,
            "annotatedPath": (
                annotated_output_abs
                if annotated_output_abs and os.path.exists(annotated_output_abs)
                else None
            ),
        },
        "summary": {
            "framesWithDetections": frames_with_detections,
            "totalDetections": int(sum(sorted_totals.values())),
            "detectionsByClass": sorted_totals,
        },
        "events": frame_events,
        "annotatedVideoPath": (
            annotated_output_abs
            if annotated_output_abs and os.path.exists(annotated_output_abs)
            else None
        ),
        "smart": smart_payload,
    }

    if output_json_path:
        output_abs = os.path.abspath(output_json_path)
        os.makedirs(os.path.dirname(output_abs), exist_ok=True)
        with open(output_abs, "w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=2, ensure_ascii=False)

    return result
