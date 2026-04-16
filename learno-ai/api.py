"""
Learno AI - FastAPI Backend
Real-time classroom recording processing.

Architecture:
- Express.js calls FastAPI POST endpoints to start/stop sessions
- FastAPI sends data TO Express.js webhook
- Raspberry Pi records locally and uploads audio to FastAPI
- FastAPI processes audio and sends results to Express.js webhook
"""

import os
import math
import sys
import json
import asyncio
import shutil
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from collections import deque

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import httpx
import sounddevice as sd
import soundfile as sf
import numpy as np

class LocalBackgroundRecorder:
    def __init__(self):
        self.stream = None
        self.frames = []
        self.is_recording = False
        self.sample_rate = 16000
        self.noise_queue: Optional[asyncio.Queue] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
    
    def callback(self, indata, frames_count, time_info, status):
        if not self.is_recording:
            return
        
        frame = indata.copy()
        self.frames.append(frame)
        
        if self.noise_queue and self.loop:
            try:
                rms = float(np.sqrt(np.mean(np.square(frame.astype(np.float32)))))
                self.loop.call_soon_threadsafe(self._queue_noise_level, rms)
            except Exception:
                # Keep recording even if monitoring fails
                pass
            
    def _queue_noise_level(self, rms: float):
        if self.noise_queue is None:
            return
        try:
            self.noise_queue.put_nowait(rms)
        except Exception:
            pass

    def start(self, noise_queue: asyncio.Queue = None, loop: asyncio.AbstractEventLoop = None):
        self.frames = []
        self.is_recording = True
        self.noise_queue = noise_queue
        self.loop = loop
        self.stream = sd.InputStream(
            samplerate=self.sample_rate, 
            channels=1, 
            dtype='int16', 
            callback=self.callback
        )
        self.stream.start()
        
    def stop(self, output_path: str):
        self.is_recording = False
        self.loop = None
        self.noise_queue = None
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None
            
        if not self.frames:
            return None
            
        audio_np = np.concatenate(self.frames, axis=0)
        sf.write(output_path, audio_np, self.sample_rate, subtype="PCM_16")
        return output_path

local_recorder = LocalBackgroundRecorder()

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# =============================================================================
# Configuration - CHANGE THESE VALUES
# =============================================================================

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
RECORDINGS_DIR = os.path.join(os.path.dirname(__file__), "recordings")
VIDEO_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "video_uploads")
VIDEO_TEST_INPUT_DIR = os.path.join(os.path.dirname(__file__), "video_test_inputs")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
VIDEO_EXTENSIONS = (".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v")
DEFAULT_SESSION_TEST_VIDEO_FILENAME = os.getenv("SESSION_TEST_VIDEO_FILENAME") or "my_video.mp4"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(VIDEO_UPLOAD_DIR, exist_ok=True)
os.makedirs(VIDEO_TEST_INPUT_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

VISION_PRELOAD_ERROR: Optional[str] = None


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except (TypeError, ValueError):
        return default


# =====================================================
# EXPRESS.JS WEBHOOK - FastAPI sends data here
# =====================================================
EXPRESS_WEBHOOK_URL = os.getenv("EXPRESS_WEBHOOK_URL", "http://localhost:4000/api/learno/webhook")
EXPRESS_WEBHOOK_KEY = os.getenv("EXPRESS_WEBHOOK_KEY", "saif")
WEBHOOK_RETRY_COUNT = max(1, _env_int("WEBHOOK_RETRY_COUNT", 3))
WEBHOOK_RETRY_DELAY_SEC = max(0.2, _env_float("WEBHOOK_RETRY_DELAY_SEC", 1.0))
WEBHOOK_MAX_PAYLOAD_BYTES = max(
    256_000,
    _env_int("WEBHOOK_MAX_PAYLOAD_BYTES", 15_000_000),
)
WEBHOOK_RESPONSE_PREVIEW_CHARS = max(
    120,
    _env_int("WEBHOOK_RESPONSE_PREVIEW_CHARS", 400),
)
WEBHOOK_RESPONSE_PREVIEW_CHARS = max(
    120,
    _env_int("WEBHOOK_RESPONSE_PREVIEW_CHARS", 400),
)

# =============================================================================
# FastAPI App
# =============================================================================

app = FastAPI(
    title="Learno AI API",
    description="Classroom audio processing - receives recordings and sends results to Express.js",
    version="1.0.0"
)

# CORS for Express.js/Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Model Preloading at Startup
# =============================================================================

@app.on_event("startup")
async def preload_models():
    """Preload ML models at server startup for faster processing."""
    import asyncio
    global VISION_PRELOAD_ERROR
    
    print("\n" + "=" * 60)
    print("🎓 LEARNO AI - PRELOADING MODELS AT STARTUP")
    print("=" * 60 + "\n")
    
    # Run model loading in a thread to not block the event loop
    loop = asyncio.get_event_loop()
    
    # Preload diarization models
    def load_diarization():
        from diarization.pipeline import preload_all_models
        preload_all_models()
    
    # Preload Whisper model (large-v3-turbo on GPU for dialect support)
    def load_whisper():
        from transcription import preload_whisper_model
        preload_whisper_model("large-v3-turbo")  # Best for Tunisian/Arabic dialects

    # Preload YOLO vision model
    def load_vision():
        global VISION_PRELOAD_ERROR
        try:
            from vision import preload_vision_model

            preload_vision_model()
            VISION_PRELOAD_ERROR = None
        except Exception as exc:
            VISION_PRELOAD_ERROR = str(exc)
            print(f"⚠️ Vision preload skipped: {exc}")
    
    # Load all in parallel threads
    await asyncio.gather(
        loop.run_in_executor(None, load_diarization),
        loop.run_in_executor(None, load_whisper),
        loop.run_in_executor(None, load_vision),
    )

    from transcription import get_whisper_device_label
    from vision import get_vision_model_info, is_vision_loaded

    whisper_device = get_whisper_device_label("large-v3-turbo")
    vision_info = get_vision_model_info()
    vision_status = "ready" if is_vision_loaded() else "not_ready"
    print("\n" + "=" * 60)
    print(
        f"ALL MODELS PRELOADED - SERVER READY "
        f"(whisper={whisper_device}, vision={vision_status}, "
        f"vision_model={vision_info.get('model_path')})"
    )
    print("=" * 60 + "\n")

# =============================================================================
# Models
# =============================================================================

class SessionStatus(str, Enum):
    PENDING = "pending"
    RECORDING = "recording"
    WAITING_UPLOAD = "waiting_upload"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class StartSessionRequest(BaseModel):
    """Request from Express.js to start a session."""
    session_id: str
    professor_id: str  # teacherId from Prisma
    timetable_id: str
    class_id: Optional[str] = None    # For Prisma Session.classId
    subject_id: Optional[str] = None  # For Prisma Session.subjectId
    course_name: Optional[str] = None  # Display name (not stored in Session)
    room_id: Optional[str] = None
    scheduled_duration_minutes: int = 60
    auto_start: bool = False  # True if auto-triggered after 5 sec countdown
    grade_level: int = 10  # Student grade level for lesson generation
    student_age: Optional[int] = None  # Optional explicit age
    test_video_filename: Optional[str] = None  # Optional fixed video from video_test_inputs/
    vision_smart_option: Optional[str] = None  # off | summary | enhanced

class StopSessionRequest(BaseModel):
    """Request from Express.js to stop a session."""
    session_id: str
    reason: Optional[str] = "manual"
    force: bool = False

class AnalyzeSessionRequest(BaseModel):
    """Request to summarize a processed session."""
    session_id: str
    session_json_path: Optional[str] = None

class WebhookPayload(BaseModel):
    """Payload sent TO Express.js webhook."""
    event: str
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class AlertType(str, Enum):
    TEACHER_DOMINATING = "teacher_dominating"
    LONG_SILENCE = "long_silence"
    BACKGROUND_NOISE = "background_noise"
    LOW_ENGAGEMENT = "low_engagement"
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"
    PROCESSING_COMPLETE = "processing_complete"
    RECORDING_RECEIVED = "recording_received"

class Alert(BaseModel):
    alert_type: AlertType
    session_id: str
    message: str
    severity: str = "info"  # info, warning, critical
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# =============================================================================
# In-Memory Session Store (replace with DB in production)
# =============================================================================

active_sessions: Dict[str, Dict[str, Any]] = {}
session_alerts: Dict[str, List[Alert]] = {}
session_results: Dict[str, Dict[str, Any]] = {}

# =============================================================================
# WebSocket Manager for Real-time Updates
# =============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)

    async def send_to_session(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    async def broadcast(self, message: dict):
        for session_id in self.active_connections:
            await self.send_to_session(session_id, message)

manager = ConnectionManager()

# =============================================================================
# Teacher Connection Manager - For auto-start/stop features
# =============================================================================

class TeacherConnectionManager:
    """Manages WebSocket connections for teachers and handles auto-start/stop."""
    
    def __init__(self):
        self.teacher_connections: Dict[str, WebSocket] = {}  # teacher_id -> websocket
        self.teacher_sessions: Dict[str, str] = {}  # teacher_id -> active session_id
        self.session_timers: Dict[str, asyncio.Task] = {}  # session_id -> auto-stop task
        self.pending_auto_start: Dict[str, str] = {}  # teacher_id -> timetable_id
        
    async def connect(self, websocket: WebSocket, teacher_id: str):
        await websocket.accept()
        self.teacher_connections[teacher_id] = websocket
        print(f"👨‍🏫 Teacher {teacher_id} connected via WebSocket")
        
    def disconnect(self, teacher_id: str):
        if teacher_id in self.teacher_connections:
            del self.teacher_connections[teacher_id]
        print(f"👨‍🏫 Teacher {teacher_id} disconnected")
        
    async def send_to_teacher(self, teacher_id: str, message: dict):
        if teacher_id in self.teacher_connections:
            try:
                await self.teacher_connections[teacher_id].send_json(message)
                return True
            except Exception as e:
                print(f"Failed to send to teacher {teacher_id}: {e}")
                return False
        return False
    
    def is_connected(self, teacher_id: str) -> bool:
        return teacher_id in self.teacher_connections
    
    def set_active_session(self, teacher_id: str, session_id: str):
        self.teacher_sessions[teacher_id] = session_id
        
    def get_active_session(self, teacher_id: str) -> Optional[str]:
        return self.teacher_sessions.get(teacher_id)
    
    def clear_active_session(self, teacher_id: str):
        if teacher_id in self.teacher_sessions:
            del self.teacher_sessions[teacher_id]

    def set_pending_auto_start(self, teacher_id: str, timetable_id: str):
        self.pending_auto_start[teacher_id] = timetable_id

    def clear_pending_auto_start(self, teacher_id: str):
        if teacher_id in self.pending_auto_start:
            del self.pending_auto_start[teacher_id]

    def has_pending_auto_start(self, teacher_id: str, timetable_id: str) -> bool:
        return self.pending_auto_start.get(teacher_id) == timetable_id

    def has_any_pending_auto_start(self, teacher_id: str) -> bool:
        return teacher_id in self.pending_auto_start

    async def send_alert(self, teacher_id: str, message: str, alert_type: str = "alert"):
        await self.send_to_teacher(teacher_id, {
            "type": alert_type,
            "message": message,
        })

teacher_manager = TeacherConnectionManager()

# =============================================================================
# Auto Session Scheduler
# =============================================================================

async def fetch_teacher_timetable(teacher_id: str) -> List[Dict[str, Any]]:
    """Fetch today's timetable for a teacher from Express.js."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:4000/api/learno/timetable/{teacher_id}",
                headers={"Authorization": f"Bearer {EXPRESS_WEBHOOK_KEY}"},
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json().get("timetable", [])
    except Exception as e:
        print(f"Failed to fetch timetable for {teacher_id}: {e}")
    return []

def parse_time_to_minutes(time_str: str) -> int:
    """Convert HH:MM or ISO datetime to minutes since midnight."""
    try:
        if "T" in time_str:
            # ISO format datetime
            dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            return dt.hour * 60 + dt.minute
        else:
            # HH:MM format
            parts = time_str.split(":")
            return int(parts[0]) * 60 + int(parts[1])
    except:
        return -1

async def check_upcoming_session(teacher_id: str) -> Optional[Dict[str, Any]]:
    """Check if there's a session starting within 2 minutes for this teacher."""
    timetable = await fetch_teacher_timetable(teacher_id)
    if not timetable:
        return None
    
    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute
    current_day = now.strftime("%A").upper()  # MONDAY, TUESDAY, etc.
    
    for entry in timetable:
        entry_day = entry.get("day", "").upper()
        if entry_day != current_day:
            continue
            
        start_minutes = parse_time_to_minutes(entry.get("startTime", ""))
        if start_minutes < 0:
            continue
            
        # Check if session starts within next 2 minutes
        diff = start_minutes - current_minutes
        if 0 <= diff <= 2:
            return entry
    
    return None

def has_teacher_live_session(teacher_id: str) -> bool:
    """True if teacher currently has a non-terminal active session in FastAPI memory."""
    for session in active_sessions.values():
        if session.get("professor_id") != teacher_id:
            continue
        status = session.get("status")
        if status in [SessionStatus.RECORDING, SessionStatus.WAITING_UPLOAD, SessionStatus.PROCESSING]:
            return True
    return False

async def auto_start_countdown(teacher_id: str, timetable_entry: Dict[str, Any]):
    """Send countdown alerts and auto-start session."""
    timetable_id = timetable_entry.get("id")
    if has_teacher_live_session(teacher_id):
        await teacher_manager.send_to_teacher(teacher_id, {
            "type": "auto_start_cancelled",
            "message": "Auto-start skipped because you already have an active session.",
        })
        return

    if timetable_id:
        # Prevent duplicate countdown tasks for the same teacher/timetable.
        if teacher_manager.has_pending_auto_start(teacher_id, timetable_id):
            return
        if teacher_manager.has_any_pending_auto_start(teacher_id):
            return
        teacher_manager.set_pending_auto_start(teacher_id, timetable_id)

    session_id = f"auto_{teacher_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        # Send initial alert
        await teacher_manager.send_to_teacher(teacher_id, {
            "type": "auto_start_alert",
            "message": "Session starting in 5 seconds...",
            "countdown": 5,
            "seconds": 5,
            "timetable": timetable_entry
        })

        # Countdown from 5 to 1
        for i in range(5, 0, -1):
            await asyncio.sleep(1)
            if timetable_id and not teacher_manager.has_pending_auto_start(teacher_id, timetable_id):
                await teacher_manager.send_to_teacher(teacher_id, {
                    "type": "auto_start_cancelled",
                    "message": "Auto-start cancelled",
                })
                return

            remaining = i - 1
            await teacher_manager.send_to_teacher(teacher_id, {
                "type": "auto_start_countdown",
                "countdown": remaining,
                "seconds": remaining,
                "message": f"Starting in {remaining}..." if i > 1 else "Starting now!"
            })

        if has_teacher_live_session(teacher_id):
            await teacher_manager.send_to_teacher(teacher_id, {
                "type": "auto_start_cancelled",
                "message": "Auto-start skipped because another session is already active.",
            })
            return

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:4000/api/learno/sessions/start",
                json={
                    "timetableId": timetable_entry.get("id"),
                    "classId": timetable_entry.get("classId"),
                    "subjectId": timetable_entry.get("subjectId"),
                    "autoStart": True
                },
                headers={
                    "Authorization": f"Bearer {EXPRESS_WEBHOOK_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )

            if response.status_code in [200, 201]:
                result = response.json()
                await teacher_manager.send_to_teacher(teacher_id, {
                    "type": "session_auto_started",
                    "session_id": result.get("session", {}).get("id"),
                    "message": "Session started automatically!"
                })
                await send_to_express_webhook(WebhookPayload(
                    event="alert",
                    session_id=result.get("session", {}).get("id") or session_id,
                    timestamp=datetime.utcnow().isoformat(),
                    data={
                        "alert_type": "session_started",
                        "session_id": result.get("session", {}).get("id") or session_id,
                        "message": "Session auto-started by timetable.",
                        "severity": "info",
                        "data": {"auto_start": True}
                    }
                ))
            else:
                await teacher_manager.send_to_teacher(teacher_id, {
                    "type": "auto_start_failed",
                    "message": "Failed to auto-start session",
                    "error": f"HTTP {response.status_code}",
                })
    except Exception as e:
        await teacher_manager.send_to_teacher(teacher_id, {
            "type": "auto_start_failed",
            "error": str(e),
            "message": "Failed to auto-start session"
        })
    finally:
        if timetable_id and teacher_manager.has_pending_auto_start(teacher_id, timetable_id):
            teacher_manager.clear_pending_auto_start(teacher_id)

async def auto_stop_session(session_id: str, teacher_id: str, duration_minutes: int):
    """Background task to auto-stop session after scheduled duration."""
    try:
        # Wait for the session duration
        await asyncio.sleep(duration_minutes * 60)
        
        # Check if session is still active
        if session_id not in active_sessions:
            return
        
        if active_sessions[session_id].get("status") != SessionStatus.RECORDING:
            return
        
        # Send auto-stop alert
        await teacher_manager.send_to_teacher(teacher_id, {
            "type": "auto_stop_alert",
            "message": "Session time is up! Stopping in 5 seconds...",
            "countdown": 5,
            "session_id": session_id
        })
        
        await manager.send_to_session(session_id, {
            "type": "auto_stop_alert",
            "message": "Session time is up! Stopping in 5 seconds...",
            "countdown": 5
        })
        
        # Countdown from 5 to 1
        for i in range(5, 0, -1):
            await asyncio.sleep(1)
            
            # Check if manually stopped during countdown
            if session_id not in active_sessions:
                return
            if active_sessions[session_id].get("status") != SessionStatus.RECORDING:
                return
                
            await teacher_manager.send_to_teacher(teacher_id, {
                "type": "auto_stop_countdown",
                "countdown": i - 1,
                "message": f"Stopping in {i-1}..." if i > 1 else "Stopping now!"
            })
        
        # Final check before auto-stop
        if session_id not in active_sessions:
            return
        if active_sessions[session_id].get("status") != SessionStatus.RECORDING:
            return
        
        # Auto-stop the session
        print(f"⏱️ Auto-stopping session {session_id} after {duration_minutes} minutes")
        
        # Stop the recording
        active_sessions[session_id]["status"] = SessionStatus.WAITING_UPLOAD
        active_sessions[session_id]["stopped_at"] = datetime.utcnow().isoformat()
        active_sessions[session_id]["stop_reason"] = "auto_timeout"
        
        # Stop local recording and get the file
        session_data = active_sessions[session_id]
        _ensure_session_result_dir(session_id, session_data)
        recording_path = generate_recording_filename(session_data)
        saved_path = local_recorder.stop(recording_path)
        
        if saved_path:
            active_sessions[session_id]["recording_path"] = saved_path
            selected_video = _pick_test_video_for_session(active_sessions[session_id])
            
            if selected_video:
                asyncio.create_task(
                    process_audio_with_test_video_background(
                        session_id,
                        saved_path,
                        selected_video,
                        session_data,
                    )
                )
            else:
                asyncio.create_task(
                    process_audio_background(session_id, saved_path, session_data)
                )
            
            await add_alert(
                session_id,
                AlertType.SESSION_ENDED,
                "Session auto-stopped after scheduled duration",
                severity="info",
                data={
                    "reason": "auto_timeout",
                    "duration_minutes": duration_minutes,
                    "video_path": selected_video,
                }
            )
        
        # Clear teacher session
        teacher_manager.clear_active_session(teacher_id)
        
        await teacher_manager.send_to_teacher(teacher_id, {
            "type": "session_auto_stopped",
            "session_id": session_id,
            "message": "Session stopped automatically!"
        })
        
    except asyncio.CancelledError:
        print(f"Auto-stop task cancelled for session {session_id}")
    except Exception as e:
        print(f"Error in auto-stop for session {session_id}: {e}")

def generate_recording_filename(session_data: Dict[str, Any]) -> str:
    """Generate a descriptive filename for the recording."""
    teacher_id = session_data.get("professor_id", "unknown")
    class_id = session_data.get("class_id", "")
    subject_id = session_data.get("subject_id", "")

    # Build filename parts
    date_str = datetime.now().strftime("%Y%m%d")
    time_str = datetime.now().strftime("%H%M%S")

    # Format: teacherId_date_subject_class_time.wav
    parts = [teacher_id[:8] if teacher_id else "unknown"]  # First 8 chars of teacher ID
    parts.append(date_str)

    if subject_id:
        parts.append(subject_id[:8])  # First 8 chars of subject ID
    if class_id:
        parts.append(class_id[:8])  # First 8 chars of class ID

    parts.append(time_str)

    filename = "_".join(parts) + ".wav"
    output_dir = session_data.get("result_dir") or RECORDINGS_DIR
    os.makedirs(output_dir, exist_ok=True)
    return os.path.join(output_dir, filename)


def _safe_component(value: Optional[str], fallback: str = "session") -> str:
    raw = (value or "").strip()
    cleaned = "".join(ch if ch.isalnum() else "_" for ch in raw).strip("_")
    if not cleaned:
        cleaned = fallback
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned[:80]


def _safe_filename(filename: Optional[str], fallback_stem: str = "file") -> str:
    base = os.path.basename(filename or "")
    if not base:
        return f"{fallback_stem}.bin"
    stem, ext = os.path.splitext(base)
    safe_stem = _safe_component(stem, fallback=fallback_stem)
    safe_ext = ext.lower() if ext else ""
    return f"{safe_stem}{safe_ext}"


def _session_result_dir_name(session_id: str, session_data: Dict[str, Any]) -> str:
    subject_title = (
        session_data.get("course_name")
        or session_data.get("subject_title")
        or session_data.get("subject_id")
        or "session"
    )
    safe_session = _safe_component(session_id, fallback="session")
    safe_subject = _safe_component(subject_title, fallback="session")
    return f"{safe_session}_{safe_subject}"


def _ensure_session_result_dir(session_id: str, session_data: Dict[str, Any]) -> str:
    existing = session_data.get("result_dir")
    if existing:
        result_dir = os.path.abspath(existing)
    else:
        result_dir = os.path.abspath(
            os.path.join(RESULTS_DIR, _session_result_dir_name(session_id, session_data))
        )
        session_data["result_dir"] = result_dir
    os.makedirs(result_dir, exist_ok=True)
    return result_dir


def _unique_target_path(target_dir: str, filename: str) -> str:
    candidate = os.path.join(target_dir, filename)
    if not os.path.exists(candidate):
        return candidate

    stem, ext = os.path.splitext(filename)
    suffix = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    fallback = os.path.join(target_dir, f"{stem}_{suffix}{ext}")
    if not os.path.exists(fallback):
        return fallback

    index = 1
    while True:
        indexed = os.path.join(target_dir, f"{stem}_{suffix}_{index}{ext}")
        if not os.path.exists(indexed):
            return indexed
        index += 1


def _relocate_file_to_dir(
    source_path: str,
    target_dir: str,
    preferred_name: Optional[str] = None,
) -> str:
    source_abs = os.path.abspath(source_path)
    target_abs = os.path.abspath(target_dir)
    os.makedirs(target_abs, exist_ok=True)

    if source_abs.startswith(target_abs + os.sep) or source_abs == target_abs:
        return source_abs

    filename = _safe_filename(preferred_name or os.path.basename(source_abs), fallback_stem="artifact")
    target_path = _unique_target_path(target_abs, filename)

    try:
        shutil.move(source_abs, target_path)
    except Exception:
        shutil.copy2(source_abs, target_path)
        try:
            os.remove(source_abs)
        except Exception:
            pass

    return target_path


def _copy_video_to_result_dir(video_path: str, target_dir: str) -> str:
    source_abs = os.path.abspath(video_path)
    target_abs = os.path.abspath(target_dir)
    os.makedirs(target_abs, exist_ok=True)

    if source_abs.startswith(target_abs + os.sep) or source_abs == target_abs:
        return source_abs

    filename = _safe_filename(os.path.basename(source_abs), fallback_stem="session_video")
    target_path = _unique_target_path(target_abs, filename)
    shutil.copy2(source_abs, target_path)
    return target_path


def _save_combined_result_json(
    session_id: str,
    session_data: Dict[str, Any],
    payload: Dict[str, Any],
) -> str:
    result_dir = _ensure_session_result_dir(session_id, session_data)
    result_path = os.path.join(result_dir, f"{_safe_component(session_id)}_combined_result.json")
    payload["finalResultJsonPath"] = result_path
    with open(result_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    return result_path


def _strip_vision_file_paths(payload: Dict[str, Any]) -> None:
    payload["visionJsonPath"] = None
    vision_analysis = payload.get("visionAnalysis")
    if isinstance(vision_analysis, dict):
        vision_analysis["outputJsonPath"] = None


def _list_test_video_names() -> List[str]:
    names: List[str] = []
    for entry in os.listdir(VIDEO_TEST_INPUT_DIR):
        full_path = os.path.join(VIDEO_TEST_INPUT_DIR, entry)
        if not os.path.isfile(full_path):
            continue
        if os.path.splitext(entry)[1].lower() not in VIDEO_EXTENSIONS:
            continue
        names.append(entry)
    return names


def _resolve_test_video_path(preferred_filename: Optional[str] = None) -> Optional[str]:
    candidate_names: List[str] = []
    if preferred_filename:
        candidate_names.append(preferred_filename)
    if DEFAULT_SESSION_TEST_VIDEO_FILENAME:
        candidate_names.append(DEFAULT_SESSION_TEST_VIDEO_FILENAME)

    for candidate in candidate_names:
        safe_name = os.path.basename(candidate)
        if safe_name != candidate:
            continue
        if os.path.splitext(safe_name)[1].lower() not in VIDEO_EXTENSIONS:
            continue
        candidate_path = os.path.abspath(os.path.join(VIDEO_TEST_INPUT_DIR, safe_name))
        if os.path.exists(candidate_path):
            return candidate_path

    available = _list_test_video_names()
    if not available:
        return None

    available.sort(
        key=lambda name: os.path.getmtime(os.path.join(VIDEO_TEST_INPUT_DIR, name)),
        reverse=True,
    )
    return os.path.abspath(os.path.join(VIDEO_TEST_INPUT_DIR, available[0]))


def _pick_test_video_for_session(session_data: Dict[str, Any]) -> Optional[str]:
    preferred_name = session_data.get("test_video_filename")
    selected_path = _resolve_test_video_path(preferred_name)
    session_data["test_video_path"] = selected_path
    if selected_path:
        session_data["video_path"] = selected_path
    return selected_path

# =============================================================================
# Helper Functions
# =============================================================================

def _json_safe_value(value: Any) -> Any:
    if isinstance(value, dict):
        safe: Dict[str, Any] = {}
        for key, nested in value.items():
            safe[str(key)] = _json_safe_value(nested)
        return safe

    if isinstance(value, list):
        return [_json_safe_value(item) for item in value]

    if isinstance(value, tuple):
        return [_json_safe_value(item) for item in value]

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, np.generic):
        return value.item()

    if isinstance(value, np.ndarray):
        return value.tolist()

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value

    return value


def _payload_size_bytes(payload: Dict[str, Any]) -> int:
    try:
        return len(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
    except Exception:
        return 0


def _trim_processing_complete_data(session_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    cleaned = _json_safe_value(data)
    if not isinstance(cleaned, dict):
        cleaned = {}

    if not cleaned.get("sessionId"):
        cleaned["sessionId"] = session_id

    if not cleaned.get("teacherId"):
        teacher_id = active_sessions.get(session_id, {}).get("professor_id")
        if teacher_id:
            cleaned["teacherId"] = teacher_id

    vision_analysis = cleaned.get("visionAnalysis")
    if isinstance(vision_analysis, dict):
        compact_vision = dict(vision_analysis)
        events = compact_vision.pop("events", None)
        if isinstance(events, list):
            compact_vision["eventCount"] = len(events)
            if events:
                compact_vision["eventSamples"] = events[:8]
        cleaned["visionAnalysis"] = compact_vision

    def _envelope_size(data_payload: Dict[str, Any]) -> int:
        return _payload_size_bytes({
            "event": "processing_complete",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data_payload,
        })

    if _envelope_size(cleaned) <= WEBHOOK_MAX_PAYLOAD_BYTES:
        return cleaned

    reduced = dict(cleaned)
    for key in ("advancedMetrics", "alerts"):
        reduced.pop(key, None)

    if _envelope_size(reduced) <= WEBHOOK_MAX_PAYLOAD_BYTES:
        reduced["payloadReduced"] = True
        return reduced

    slimmer = dict(reduced)
    transcript_text = slimmer.get("transcriptText")
    if isinstance(transcript_text, str) and len(transcript_text) > 12000:
        slimmer["transcriptText"] = transcript_text[:12000]

    advice_text = slimmer.get("adviceText")
    if isinstance(advice_text, str) and len(advice_text) > 4000:
        slimmer["adviceText"] = advice_text[:4000]

    lesson_data = slimmer.get("lessonData")
    if isinstance(lesson_data, dict):
        compact_lesson = dict(lesson_data)
        chapters = compact_lesson.get("chapters")
        if isinstance(chapters, list):
            compact_lesson["chapters"] = chapters[:6]
            for chapter in compact_lesson["chapters"]:
                if isinstance(chapter, dict):
                    content = chapter.get("content")
                    if isinstance(content, str) and len(content) > 2500:
                        chapter["content"] = content[:2500]
        slimmer["lessonData"] = compact_lesson

    if _envelope_size(slimmer) <= WEBHOOK_MAX_PAYLOAD_BYTES:
        slimmer["payloadReduced"] = True
        return slimmer

    minimal_keys = (
        "sessionId",
        "teacherId",
        "timetableId",
        "classId",
        "subjectId",
        "teacherRatio",
        "studentRatio",
        "teacherMinutes",
        "studentMinutes",
        "engagementScore",
        "engagementBand",
        "silenceCount",
        "longestSilenceSec",
        "totalSilenceSec",
        "lessonPdfPath",
        "lessonJsonPath",
        "advicePdfPath",
        "sessionJsonPath",
        "processedAt",
        "resultDir",
        "finalResultJsonPath",
        "audioPath",
        "videoPath",
        "visionJsonPath",
        "visionAnnotatedVideoPath",
        "audioError",
        "visionError",
    )
    minimal: Dict[str, Any] = {
        key: slimmer[key]
        for key in minimal_keys
        if key in slimmer
    }
    minimal.setdefault("sessionId", session_id)
    if not minimal.get("teacherId"):
        teacher_id = active_sessions.get(session_id, {}).get("professor_id")
        if teacher_id:
            minimal["teacherId"] = teacher_id
    minimal["payloadReduced"] = True
    return minimal


def _build_webhook_payload_dict(payload: WebhookPayload) -> Dict[str, Any]:
    payload_dict = payload.model_dump()
    payload_dict = _json_safe_value(payload_dict)
    if not isinstance(payload_dict, dict):
        payload_dict = {}

    event = payload_dict.get("event")
    session_id = str(payload_dict.get("session_id") or payload.session_id)
    raw_data = payload_dict.get("data", {})
    if not isinstance(raw_data, dict):
        raw_data = {"value": raw_data}

    if event == "processing_complete":
        complete_data = _trim_processing_complete_data(session_id, raw_data)
        if not complete_data.get("teacherId"):
            payload_dict["event"] = "processing_failed"
            payload_dict["data"] = {
                "error": "processing_complete payload missing teacherId",
                "sessionId": complete_data.get("sessionId") or session_id,
                "finalResultJsonPath": complete_data.get("finalResultJsonPath"),
            }
        else:
            payload_dict["data"] = complete_data
    else:
        payload_dict["data"] = _json_safe_value(raw_data)

    return payload_dict


async def send_to_express_webhook(payload: WebhookPayload):
    """Send data TO Express.js webhook."""
    payload_dict = _build_webhook_payload_dict(payload)
    payload_size = _payload_size_bytes(payload_dict)
    event_name = str(payload_dict.get("event", payload.event))
    session_id = str(payload_dict.get("session_id", payload.session_id))

    if payload_size > WEBHOOK_MAX_PAYLOAD_BYTES:
        print(
            "⚠️ Webhook payload may still be too large "
            f"({payload_size} bytes, event={event_name}, session={session_id})"
        )

    async with httpx.AsyncClient() as client:
        for attempt in range(1, WEBHOOK_RETRY_COUNT + 1):
            try:
                response = await client.post(
                    EXPRESS_WEBHOOK_URL,
                    json=payload_dict,
                    headers={
                        "Authorization": f"Bearer {EXPRESS_WEBHOOK_KEY}",
                        "Content-Type": "application/json"
                    },
                    timeout=15.0
                )

                if 200 <= response.status_code < 300:
                    return True

                response_preview = (response.text or "")[:WEBHOOK_RESPONSE_PREVIEW_CHARS]
                response_preview = response_preview.replace("\n", " ").strip()
                print(
                    "Express webhook non-2xx response "
                    f"(status={response.status_code}, event={event_name}, "
                    f"session={session_id}, attempt={attempt}/{WEBHOOK_RETRY_COUNT}) "
                    f"{response_preview}"
                )
            except Exception as exc:
                print(
                    "Express webhook error "
                    f"(event={event_name}, session={session_id}, "
                    f"attempt={attempt}/{WEBHOOK_RETRY_COUNT}): {exc}"
                )

            if attempt < WEBHOOK_RETRY_COUNT:
                await asyncio.sleep(WEBHOOK_RETRY_DELAY_SEC * attempt)

    return False

async def add_alert(session_id: str, alert_type: AlertType, message: str,
                    severity: str = "info", data: dict = None):
    """Add alert and send via webhook + WebSocket."""
    alert = Alert(
        alert_type=alert_type,
        session_id=session_id,
        message=message,
        severity=severity,
        data=data
    )

    if session_id not in session_alerts:
        session_alerts[session_id] = []
    session_alerts[session_id].append(alert)

    # Send via WebSocket
    await manager.send_to_session(session_id, {
        "type": "alert",
        "alert": alert.model_dump()
    })

    # Send via webhook
    await send_to_express_webhook(WebhookPayload(
        event="alert",
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat(),
        data=alert.model_dump()
    ))

def rms_to_dbfs(rms: float, ref: float = 32768.0) -> float:
    """Convert RMS (int16 domain) to dBFS."""
    if rms <= 0:
        return -120.0
    return 20.0 * np.log10(max(rms / ref, 1e-9))


async def monitor_startup_noise(session_id: str, 
                                loud_threshold_dbfs: float = -38.0,
                                speech_threshold_dbfs: float = -50.0,
                                sustain_count: int = 4,
                                alert_cooldown_sec: float = 25.0):
    """
    Monitor microphone RMS levels throughout session and raise alerts for:
    - Loud noise/yelling (above loud_threshold)
    - Fast/overlapping speech (high variance in speech range)
    """
    print(f"🎤 [NOISE MONITOR] Starting for session {session_id}")
    
    noise_queue = local_recorder.noise_queue
    if noise_queue is None:
        print("❌ [NOISE MONITOR] No noise queue available!")
        return

    loud_window = deque(maxlen=sustain_count)
    speech_window = deque(maxlen=20)  # Track more samples for variance
    loop = asyncio.get_event_loop()
    sample_count = 0
    last_loud_alert = 0.0
    last_speech_alert = 0.0

    while True:
        status = active_sessions.get(session_id, {}).get("status")
        if status != SessionStatus.RECORDING:
            print(f"⏹️ [NOISE MONITOR] Session ended, stopping monitor")
            break

        try:
            rms = await asyncio.wait_for(noise_queue.get(), timeout=2.0)
        except asyncio.TimeoutError:
            continue
        except Exception as e:
            print(f"❌ [NOISE MONITOR] Error: {e}")
            break

        dbfs = rms_to_dbfs(rms)
        sample_count += 1
        current_time = loop.time()
        
        if sample_count % 100 == 0:
            print(f"🔊 [NOISE] #{sample_count}: {dbfs:.1f} dBFS")

        # === LOUD NOISE DETECTION ===
        is_loud = dbfs >= loud_threshold_dbfs
        loud_window.append(is_loud)
        
        if (len(loud_window) == sustain_count and all(loud_window) 
            and (current_time - last_loud_alert) >= alert_cooldown_sec):
            print(f"🚨 [LOUD NOISE] {dbfs:.1f} dBFS - Very loud!")
            await add_alert(
                session_id,
                AlertType.BACKGROUND_NOISE,
                f"🔊 Very loud noise detected ({dbfs:.1f} dBFS) - possible yelling or disruption",
                severity="warning",
                data={"dbfs": round(dbfs, 1), "type": "loud_noise"}
            )
            last_loud_alert = current_time
            loud_window.clear()

        # === FAST/OVERLAPPING SPEECH DETECTION ===
        # Track speech-level samples (between ambient and loud)
        is_speech = speech_threshold_dbfs <= dbfs < loud_threshold_dbfs
        speech_window.append(dbfs if is_speech else -80.0)
        
        if len(speech_window) == 20:
            # Calculate variance - high variance = rapid changes = fast/overlapping speech
            speech_samples = [s for s in speech_window if s > -80.0]
            if len(speech_samples) >= 15:  # Mostly speech
                variance = np.var(speech_samples)
                mean_level = np.mean(speech_samples)
                
                # High variance (>30) with decent volume = chaotic/fast speech
                if (variance > 30 and mean_level > -48 
                    and (current_time - last_speech_alert) >= alert_cooldown_sec):
                    print(f"🚨 [FAST SPEECH] variance={variance:.1f}, mean={mean_level:.1f} dBFS")
                    await add_alert(
                        session_id,
                        AlertType.BACKGROUND_NOISE,
                        f"🗣️ Rapid or overlapping speech detected - possible student chatter",
                        severity="info",
                        data={"variance": round(variance, 1), "mean_dbfs": round(mean_level, 1), "type": "fast_speech"}
                    )
                    last_speech_alert = current_time
                    speech_window.clear()
    
    print(f"✅ [NOISE MONITOR] Finished after {sample_count} samples")


async def process_audio_background(
    session_id: str,
    audio_path: str,
    session_data: dict,
    defer_completion: bool = False,
):
    """Background task to process audio and send real-time updates."""
    try:
        # Check if session was force-stopped - abort if so
        session_status = session_data.get("status")
        forced_stop = session_data.get("forced_stop", False)
        
        # Handle both enum and string comparisons
        status_failed = (
            session_status == SessionStatus.FAILED or 
            session_status == "failed" or
            str(session_status) == "failed"
        )
        
        if status_failed or forced_stop:
            print(f"⚠️ Session {session_id} was force-stopped (status={session_status}, forced={forced_stop}), aborting audio processing")
            return

        # Update status
        active_sessions[session_id]["status"] = SessionStatus.PROCESSING

        result_dir = _ensure_session_result_dir(session_id, session_data)
        audio_filename = _safe_filename(os.path.basename(audio_path), fallback_stem="session_audio")
        audio_path = _relocate_file_to_dir(audio_path, result_dir, preferred_name=audio_filename)
        session_data["recording_path"] = audio_path
        active_sessions[session_id]["recording_path"] = audio_path

        await manager.send_to_session(session_id, {
            "type": "status",
            "status": "processing",
            "message": "Processing audio..."
        })

        # Send webhook
        await send_to_express_webhook(WebhookPayload(
            event="processing_started",
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
            data={"audio_path": audio_path}
        ))

        # ── Minimum duration check ───────────────────────────
        try:
            import soundfile as _sf
            info = _sf.info(audio_path)
            audio_duration_sec = info.duration
            print(f"🎵 Audio duration: {audio_duration_sec:.1f}s ({info.samplerate}Hz, {info.channels}ch)")
        except Exception as e:
            audio_duration_sec = 0
            print(f"⚠️ Could not read audio info: {e}")

        MIN_DURATION_SEC = 5
        if audio_duration_sec < MIN_DURATION_SEC:
            error_msg = f"Recording too short ({audio_duration_sec:.1f}s). Minimum is {MIN_DURATION_SEC}s for analysis."
            print(f"❌ {error_msg}")
            active_sessions[session_id]["status"] = SessionStatus.FAILED
            error_payload = {
                "sessionId": session_id,
                "error": error_msg,
                "durationSec": audio_duration_sec,
                "audioPath": audio_path,
                "resultDir": result_dir,
            }
            session_results[session_id] = error_payload

            await manager.send_to_session(session_id, {
                "type": "error",
                "message": error_msg
            })

            if not defer_completion:
                await send_to_express_webhook(WebhookPayload(
                    event="processing_failed",
                    session_id=session_id,
                    timestamp=datetime.utcnow().isoformat(),
                    data={"error": error_msg, "duration_sec": audio_duration_sec}
                ))
            return error_payload
        # ─────────────────────────────────────────────────────

        # Step 1: Diarization
        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "diarization",
            "progress": 10,
            "message": "Running speaker diarization..."
        })

        from diarization.session import process_session
        session_result = process_session(audio_path, intro_duration=60, save_json=True)

        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "diarization",
            "progress": 40,
            "message": "Diarization complete"
        })

        # Check for alerts
        json_data = session_result.get("json", {})
        session_json_path = session_result.get("json_path")
        alert_flags = json_data.get("alert_flags", {})
        advanced_metrics = json_data.get("advanced_metrics", {})

        if alert_flags.get("teacher_dominating"):
            await add_alert(
                session_id,
                AlertType.TEACHER_DOMINATING,
                f"Teacher talk time exceeds 85% ({json_data.get('teacher_ratio', 0)*100:.1f}%)",
                severity="warning",
                data={"teacher_ratio": json_data.get("teacher_ratio")}
            )

        if alert_flags.get("long_silence_found"):
            await add_alert(
                session_id,
                AlertType.LONG_SILENCE,
                f"Long silence detected ({alert_flags.get('longest_silence_sec', 0):.1f}s)",
                severity="info",
                data={"silence_gaps": json_data.get("silence_gaps")}
            )

        # Step 2: Transcription
        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "transcription",
            "progress": 50,
            "message": "Transcribing audio..."
        })

        teacher_wav = session_result.get("teacher_recap_path")
        whisper_result = None
        output_dir = result_dir
        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        whisper_json_path = os.path.join(output_dir, f"{base_name}_Whisper.json")
        whisper_words_json_path = os.path.join(output_dir, f"{base_name}_Whisper_words.json")

        if teacher_wav and os.path.exists(teacher_wav):
            from transcription import transcribe_teacher_audio
            # Use large-v3-turbo with auto language detection
            # Arabic will automatically use Tunisian dialect prompts
            whisper_result = transcribe_teacher_audio(
                teacher_wav, 
                model_size="large-v3-turbo",
                out_json_path=whisper_json_path,
                out_words_json_path=whisper_words_json_path,
                # language=None enables auto-detection (French, English, Arabic, etc.)
                # For Arabic, Tunisian dialect is used automatically
            )

        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "transcription",
            "progress": 70,
            "message": "Transcription complete"
        })

        # Step 3: Generate Lesson PDF and JSON
        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "pdf_generation",
            "progress": 75,
            "message": "Generating lesson PDF..."
        })

        lesson_pdf_path = None
        lesson_json_path = None
        lesson_data = None
        advice_pdf_path = None

        # Get grade level from session data
        grade_level = session_data.get("grade_level", 10)
        student_age = session_data.get("student_age")

        if whisper_result:
            from gemini import generate_lesson_pdf_and_json
            
            # Generate both PDF and JSON for student dashboard
            lesson_result = generate_lesson_pdf_and_json(
                whisper_result=whisper_result,
                audio_file=audio_path,
                output_dir=output_dir,
                session_id=session_id,
                teacher_id=session_data.get("professor_id"),
                class_id=session_data.get("class_id"),
                subject_id=session_data.get("subject_id"),
                grade_level=grade_level,
            )
            
            lesson_pdf_path = lesson_result.get("lessonPdfPath")
            lesson_json_path = lesson_result.get("lessonJsonPath")
            lesson_data = lesson_result.get("lessonData")

        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "lesson_json",
            "progress": 85,
            "message": "Lesson JSON generated for student dashboard"
        })

        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "advice_generation",
            "progress": 90,
            "message": "Generating teacher advice insights..."
        })

        # We don't save the advice_pdf_path anymore for advice_text, but we keep it matching if we do
        advice_pdf_path = os.path.join(output_dir, f"{base_name}_Advice.pdf")
        
        from gemini import generate_advice_text, extract_advice_points
        advice_text = generate_advice_text(json_data, os.path.basename(audio_path))
        advice_summary = extract_advice_points(advice_text)

        if not defer_completion:
            await manager.send_to_session(session_id, {
                "type": "progress",
                "step": "complete",
                "progress": 100,
                "message": "Processing complete!"
            })

        # Build final result - matches Prisma Session model
        # Extract engagement score (object -> int + band)
        engagement_obj = advanced_metrics.get("engagement_score", {}) if isinstance(advanced_metrics, dict) else {}
        engagement_score = engagement_obj.get("score", 0) if isinstance(engagement_obj, dict) else 0
        engagement_band = engagement_obj.get("band", "unknown") if isinstance(engagement_obj, dict) else "unknown"

        # Summarize silence gaps (don't send every gap, just summary)
        silence_gaps = json_data.get("silence_gaps", [])
        silence_count = len(silence_gaps)
        longest_silence = max((gap.get("duration", 0) for gap in silence_gaps), default=0.0)
        total_silence = sum(gap.get("duration", 0) for gap in silence_gaps)

        final_result = {
            # Session identifiers (camelCase for Express/Prisma)
            "sessionId": session_id,
            "teacherId": session_data.get("professor_id"),
            "timetableId": session_data.get("timetable_id"),
            "classId": session_data.get("class_id"),      # From session data
            "subjectId": session_data.get("subject_id"),  # From session data

            # Talk time metrics
            "teacherRatio": json_data.get("teacher_ratio"),
            "studentRatio": json_data.get("student_ratio"),
            "teacherMinutes": json_data.get("teacher_minutes"),
            "studentMinutes": json_data.get("student_minutes"),

            # Engagement (extracted from object)
            "engagementScore": engagement_score,
            "engagementBand": engagement_band,

            # Silence summary (not individual gaps)
            "silenceCount": silence_count,
            "longestSilenceSec": round(longest_silence, 2),
            "totalSilenceSec": round(total_silence, 2),

            # Transcription
            "transcriptText": whisper_result.get("text") if whisper_result else None,
            "transcriptJsonPath": whisper_json_path if whisper_result else None,
            "whisperWordsJsonPath": whisper_words_json_path if whisper_result else None,
            "whisperWordExtract": whisper_result.get("word_extract") if whisper_result else None,

            # Transcription NLP metadata
            "transcriptionMeta": whisper_result.get("transcription_meta") if whisper_result else None,

            # Generated files
            "lessonPdfPath": lesson_pdf_path,
            "lessonJsonPath": lesson_json_path,
            "advicePdfPath": advice_pdf_path,
            "adviceSummary": advice_summary,
            "adviceText": advice_text,

            # Session analysis helpers
            "sessionJsonPath": session_json_path,
            "advancedMetrics": advanced_metrics,
            "alertFlags": alert_flags,

            # Lesson data for student dashboard (chapters, XP, etc.)
            "lessonData": lesson_data,

            # Alerts for SessionAlert table
            "alerts": [a.model_dump() for a in session_alerts.get(session_id, [])],

            # Timestamp
            "processedAt": datetime.utcnow().isoformat(),
            "audioPath": audio_path,
            "resultDir": result_dir,
        }

        combined_json_path = _save_combined_result_json(session_id, session_data, final_result)
        final_result["finalResultJsonPath"] = combined_json_path

        session_results[session_id] = final_result

        if defer_completion:
            await manager.send_to_session(session_id, {
                "type": "progress",
                "step": "audio_complete",
                "progress": 95,
                "message": "Audio analysis complete. Waiting for video analysis..."
            })
            return final_result

        active_sessions[session_id]["status"] = SessionStatus.COMPLETED

        await send_to_express_webhook(WebhookPayload(
            event="processing_complete",
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
            data=final_result
        ))

        await manager.send_to_session(session_id, {
            "type": "result",
            "result": final_result,
        })

        await add_alert(
            session_id,
            AlertType.PROCESSING_COMPLETE,
            "Session processing completed successfully",
            severity="info",
            data={"lesson_pdf": lesson_pdf_path, "advice_pdf": advice_pdf_path}
        )

        return final_result

    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()

        active_sessions[session_id]["status"] = SessionStatus.FAILED
        active_sessions[session_id]["error"] = error_msg
        active_sessions[session_id]["traceback"] = error_trace
        session_results[session_id] = {
            "sessionId": session_id,
            "error": error_msg,
            "traceback": error_trace,
            "audioPath": active_sessions.get(session_id, {}).get("recording_path"),
            "resultDir": active_sessions.get(session_id, {}).get("result_dir"),
        }

        await manager.send_to_session(session_id, {
            "type": "error",
            "message": error_msg,
            "traceback": error_trace
        })

        if not defer_completion:
            await send_to_express_webhook(WebhookPayload(
                event="processing_failed",
                session_id=session_id,
                timestamp=datetime.utcnow().isoformat(),
                data={"error": error_msg}
            ))

            await add_alert(
                session_id,
                AlertType.PROCESSING_COMPLETE,
                f"Processing failed: {error_msg}",
                severity="critical",
                data={"error": error_msg}
            )

        return session_results[session_id]


def _merge_video_analysis(
    session_id: str,
    video_path: str,
    audio_path: str,
    vision_json_path: str,
    vision_result: Optional[Dict[str, Any]],
    result_dir: Optional[str] = None,
    audio_error: Optional[str] = None,
    vision_error: Optional[str] = None,
):
    """Attach video/vision analysis details to an existing session result."""
    merged = session_results.get(session_id, {"sessionId": session_id})
    merged["analysisMode"] = "parallel_audio_vision"
    merged["videoPath"] = video_path
    merged["extractedAudioPath"] = audio_path
    merged["visionJsonPath"] = None
    merged["visionAnalysis"] = vision_result
    merged["visionSummary"] = vision_result.get("summary") if isinstance(vision_result, dict) else None
    merged["visionAnnotatedVideoPath"] = (
        vision_result.get("annotatedVideoPath") if isinstance(vision_result, dict) else None
    )
    merged["resultDir"] = result_dir or merged.get("resultDir")
    merged["audioError"] = audio_error
    merged["visionError"] = vision_error
    merged["videoProcessedAt"] = datetime.utcnow().isoformat()

    session_results[session_id] = merged


async def process_audio_with_test_video_background(
    session_id: str,
    audio_path: str,
    video_path: str,
    session_data: dict,
):
    """Run audio pipeline and YOLO video pipeline in parallel and join final result."""
    # Check if session was force-stopped - abort if so
    session_status = session_data.get("status")
    forced_stop = session_data.get("forced_stop", False)
    
    # Handle both enum and string comparisons
    status_failed = (
        session_status == SessionStatus.FAILED or 
        session_status == "failed" or
        str(session_status) == "failed"
    )
    
    if status_failed or forced_stop:
        print(f"⚠️ Session {session_id} was force-stopped (status={session_status}, forced={forced_stop}), aborting audio+video processing")
        return

    print(f"🔄 Starting audio+video processing for session {session_id} (status={session_status})")

    result_dir = _ensure_session_result_dir(session_id, session_data)

    audio_filename = _safe_filename(os.path.basename(audio_path), fallback_stem="session_audio")
    final_audio_path = _relocate_file_to_dir(audio_path, result_dir, preferred_name=audio_filename)

    staged_video_path = _copy_video_to_result_dir(video_path, result_dir)

    base_name = os.path.splitext(os.path.basename(final_audio_path))[0]
    vision_json_path = os.path.join(result_dir, f"{base_name}_Vision.json")
    annotated_video_path = os.path.join(result_dir, f"{base_name}_Vision_annotated.mp4")

    try:
        active_sessions[session_id]["status"] = SessionStatus.PROCESSING
        active_sessions[session_id]["recording_path"] = final_audio_path
        active_sessions[session_id]["video_path"] = staged_video_path
        active_sessions[session_id]["result_dir"] = result_dir
        session_data["recording_path"] = final_audio_path
        session_data["video_path"] = staged_video_path
        session_data["result_dir"] = result_dir

        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "parallel_start",
            "progress": 10,
            "message": "Starting audio and video analysis in parallel...",
        })

        loop = asyncio.get_event_loop()

        def run_vision_analysis() -> Dict[str, Any]:
            from vision import analyze_video_file

            return analyze_video_file(
                video_path=staged_video_path,
                output_json_path=None,
                output_annotated_video_path=annotated_video_path,
                frame_stride=5,
                conf_threshold=0.5,
                smart_option=session_data.get("vision_smart_option"),
            )

        vision_task = loop.run_in_executor(None, run_vision_analysis)
        audio_task = asyncio.create_task(
            process_audio_background(
                session_id,
                final_audio_path,
                session_data,
                defer_completion=True,
            )
        )

        audio_result, vision_result = await asyncio.gather(
            audio_task,
            vision_task,
            return_exceptions=True,
        )

        if isinstance(audio_result, Exception):
            audio_error = str(audio_result)
            audio_payload = session_results.get(session_id)
        else:
            audio_payload = audio_result if isinstance(audio_result, dict) else session_results.get(session_id)
            if isinstance(audio_payload, dict) and audio_payload.get("error"):
                audio_error = str(audio_payload.get("error"))
            else:
                audio_error = None

        vision_error = str(vision_result) if isinstance(vision_result, Exception) else None
        vision_payload = None if vision_error else vision_result

        _merge_video_analysis(
            session_id=session_id,
            video_path=staged_video_path,
            audio_path=final_audio_path,
            vision_json_path=vision_json_path,
            vision_result=vision_payload,
            result_dir=result_dir,
            audio_error=audio_error,
            vision_error=vision_error,
        )

        active_sessions[session_id]["vision_json_path"] = None
        active_sessions[session_id]["vision_annotated_video_path"] = (
            annotated_video_path if os.path.exists(annotated_video_path) else None
        )

        if audio_error:
            active_sessions[session_id]["status"] = SessionStatus.FAILED
            await manager.send_to_session(session_id, {
                "type": "error",
                "message": f"Audio analysis failed: {audio_error}",
            })
        else:
            active_sessions[session_id]["status"] = SessionStatus.COMPLETED
            await manager.send_to_session(session_id, {
                "type": "progress",
                "step": "complete",
                "progress": 100,
                "message": "Audio and video analysis complete",
            })

        final_payload = session_results.get(session_id, {"sessionId": session_id})
        if isinstance(final_payload, dict):
            final_payload["resultDir"] = result_dir
            final_payload["videoPath"] = staged_video_path
            final_payload["audioPath"] = final_audio_path
            final_payload["visionSmartOption"] = session_data.get("vision_smart_option")
            final_payload["visionJsonPath"] = (
                None
            )
            final_payload["visionAnnotatedVideoPath"] = (
                annotated_video_path if os.path.exists(annotated_video_path) else None
            )

            vision_analysis_payload = final_payload.get("visionAnalysis")
            if isinstance(vision_analysis_payload, dict):
                smart_payload = vision_analysis_payload.get("smart")
                if isinstance(smart_payload, dict):
                    enhancement_payload = smart_payload.get("enhancement")
                    if isinstance(enhancement_payload, dict):
                        summary_payload = enhancement_payload.get("summary")
                        if isinstance(summary_payload, dict):
                            final_payload["classEngagementAvg"] = summary_payload.get("meanCAES")
                            final_payload["classEngagementMin"] = summary_payload.get("minCAES")
                            final_payload["classEngagementMax"] = summary_payload.get("maxCAES")
                            final_payload["classStudentCount"] = summary_payload.get("studentCount")
                            final_payload["lowEngagementCount"] = len(summary_payload.get("lowEngagementStudents", []))
                            total_frames = 0
                            students_list = summary_payload.get("students")
                            if isinstance(students_list, list):
                                for student in students_list:
                                    if isinstance(student, dict):
                                        frames = student.get("framesAnalyzed")
                                        if isinstance(frames, (int, float)):
                                            total_frames += int(frames)
                            final_payload["totalFramesAnalyzed"] = total_frames

            _strip_vision_file_paths(final_payload)
            final_payload["finalResultJsonPath"] = _save_combined_result_json(
                session_id,
                session_data,
                final_payload,
            )
            session_results[session_id] = final_payload

        if audio_error:
            await send_to_express_webhook(WebhookPayload(
                event="processing_failed",
                session_id=session_id,
                timestamp=datetime.utcnow().isoformat(),
                data={
                    "error": audio_error,
                    "audioPath": final_audio_path,
                    "videoPath": staged_video_path,
                    "visionError": vision_error,
                    "finalResultJsonPath": (
                        final_payload.get("finalResultJsonPath")
                        if isinstance(final_payload, dict)
                        else None
                    ),
                },
            ))
        else:
            await send_to_express_webhook(WebhookPayload(
                event="processing_complete",
                session_id=session_id,
                timestamp=datetime.utcnow().isoformat(),
                data=final_payload,
            ))

        await manager.send_to_session(session_id, {
            "type": "result",
            "result": final_payload,
        })

        if audio_error:
            await add_alert(
                session_id,
                AlertType.PROCESSING_COMPLETE,
                f"Audio processing failed while waiting for video: {audio_error}",
                severity="critical",
                data={"video_path": staged_video_path, "vision_error": vision_error},
            )
        elif vision_error:
            await add_alert(
                session_id,
                AlertType.PROCESSING_COMPLETE,
                f"Audio complete, but video analysis failed: {vision_error}",
                severity="warning",
                data={"video_path": staged_video_path, "audio_path": final_audio_path},
            )
        else:
            await add_alert(
                session_id,
                AlertType.PROCESSING_COMPLETE,
                "Audio and video processing completed successfully",
                severity="info",
                data={
                    "audio_path": final_audio_path,
                    "video_path": staged_video_path,
                    "vision_json_path": None,
                    "vision_annotated_video_path": (
                        annotated_video_path if os.path.exists(annotated_video_path) else None
                    ),
                },
            )

    except Exception as exc:
        error_msg = str(exc)
        active_sessions[session_id]["status"] = SessionStatus.FAILED
        active_sessions[session_id]["error"] = error_msg
        await manager.send_to_session(session_id, {
            "type": "error",
            "message": error_msg,
        })
        await send_to_express_webhook(WebhookPayload(
            event="processing_failed",
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
            data={"error": error_msg, "video_path": staged_video_path, "audio_path": final_audio_path},
        ))


async def process_video_background(session_id: str, video_path: str, session_data: dict):
    """Run audio and vision analysis in parallel for uploaded video."""
    # Check if session was force-stopped - abort if so
    session_status = session_data.get("status")
    forced_stop = session_data.get("forced_stop", False)
    
    status_failed = (
        session_status == SessionStatus.FAILED or 
        session_status == "failed" or
        str(session_status) == "failed"
    )
    
    if status_failed or forced_stop:
        print(f"⚠️ Session {session_id} was force-stopped, aborting video processing")
        return
    
    result_dir = _ensure_session_result_dir(session_id, session_data)
    output_dir = result_dir
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    extracted_audio_path = os.path.join(output_dir, f"{base_name}_audio.wav")

    try:
        await manager.send_to_session(session_id, {
            "type": "progress",
            "step": "video_prepare",
            "progress": 5,
            "message": "Extracting audio from video...",
        })

        loop = asyncio.get_event_loop()
        from utils import convert_to_wav_16k

        await loop.run_in_executor(None, convert_to_wav_16k, video_path, extracted_audio_path)
        active_sessions[session_id]["source"] = session_data.get("source", "video_upload")

        await process_audio_with_test_video_background(
            session_id=session_id,
            audio_path=extracted_audio_path,
            video_path=video_path,
            session_data=session_data,
        )
    except Exception as exc:
        error_msg = str(exc)
        active_sessions[session_id]["status"] = SessionStatus.FAILED
        active_sessions[session_id]["error"] = error_msg
        await manager.send_to_session(session_id, {
            "type": "error",
            "message": error_msg,
        })
        await send_to_express_webhook(WebhookPayload(
            event="processing_failed",
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
            data={"error": error_msg, "video_path": video_path},
        ))

# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
async def root():
    return {"message": "Learno AI API", "version": "1.0.0"}

@app.get("/health")
async def health():
    """Health check with model status."""
    from diarization.pipeline import are_models_loaded
    from transcription import is_whisper_loaded, get_whisper_device_label
    from vision import get_vision_model_info, is_vision_loaded
    
    diarization_ready = are_models_loaded()
    whisper_model_size = "large-v3-turbo"
    whisper_ready = is_whisper_loaded(whisper_model_size)
    vision_ready = is_vision_loaded()
    vision_info = get_vision_model_info()

    audio_ready = diarization_ready and whisper_ready
    video_ready = audio_ready and vision_ready

    if vision_ready:
        vision_status = "ready"
    elif VISION_PRELOAD_ERROR:
        vision_status = "error"
    else:
        vision_status = "loading"
    
    return {
        "status": "healthy" if audio_ready else "warming_up",
        "models": {
            "diarization": "ready" if diarization_ready else "loading",
            "whisper": "ready" if whisper_ready else "loading",
            "whisper_model": whisper_model_size,
            "whisper_device": get_whisper_device_label(whisper_model_size) if whisper_ready else None,
            "vision": vision_status,
            "vision_model_path": vision_info.get("model_path"),
            "vision_preload_error": VISION_PRELOAD_ERROR,
        },
        "ready_for_processing": audio_ready,
        "ready_for_video_processing": video_ready,
        "timestamp": datetime.utcnow().isoformat()
    }

# -----------------------------------------------------------------------------
# File Serving (for PDFs and JSON files)
# -----------------------------------------------------------------------------

@app.get("/files/{file_path:path}")
async def serve_file(file_path: str):
    """
    Serve generated files (PDFs, JSONs) from recordings directory.
    """
    # Security: Only allow files from recordings directory
    full_path = os.path.abspath(file_path)
    recordings_abs = os.path.abspath(RECORDINGS_DIR)
    uploads_abs = os.path.abspath(UPLOAD_DIR)
    video_upload_abs = os.path.abspath(VIDEO_UPLOAD_DIR)
    video_test_abs = os.path.abspath(VIDEO_TEST_INPUT_DIR)
    results_abs = os.path.abspath(RESULTS_DIR)
    
    # Check if file is within allowed directories
    if not (
        full_path.startswith(recordings_abs)
        or full_path.startswith(uploads_abs)
        or full_path.startswith(video_upload_abs)
        or full_path.startswith(video_test_abs)
        or full_path.startswith(results_abs)
    ):
        # Also check if the path itself is valid
        if not os.path.exists(full_path):
            raise HTTPException(404, "File not found")
        # Allow if it's a valid path that exists (for direct paths from lessonData)
    
    if not os.path.exists(full_path):
        raise HTTPException(404, "File not found")
    
    # Determine content type
    if full_path.endswith('.pdf'):
        media_type = "application/pdf"
    elif full_path.endswith('.json'):
        media_type = "application/json"
    elif full_path.endswith('.wav'):
        media_type = "audio/wav"
    elif full_path.endswith(('.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v')):
        media_type = "video/mp4"
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(full_path, media_type=media_type)

# -----------------------------------------------------------------------------
# Session Control (Called by Express.js)
# -----------------------------------------------------------------------------

@app.post("/session/start")
async def start_session(request: StartSessionRequest):
    """
    POST action called by Express.js when professor starts a lesson.
    Creates session and waits for Raspberry Pi to upload recording.
    """
    session_id = request.session_id

    if session_id in active_sessions:
        raise HTTPException(400, f"Session {session_id} already active")

    selected_test_video = _resolve_test_video_path(request.test_video_filename)

    # Store session data
    active_sessions[session_id] = {
        "session_id": session_id,
        "professor_id": request.professor_id,
        "timetable_id": request.timetable_id,
        "class_id": request.class_id,
        "subject_id": request.subject_id,
        "subject_title": request.course_name,
        "course_name": request.course_name,
        "room_id": request.room_id,
        "scheduled_duration": request.scheduled_duration_minutes,
        "auto_start": request.auto_start,
        "grade_level": request.grade_level,
        "student_age": request.student_age,
        "test_video_filename": request.test_video_filename,
        "vision_smart_option": request.vision_smart_option,
        "test_video_path": selected_test_video,
        "video_path": selected_test_video,
        "status": SessionStatus.RECORDING,
        "started_at": datetime.utcnow().isoformat(),
        "recording_path": None
    }
    _ensure_session_result_dir(session_id, active_sessions[session_id])

    # Start local testing recording
    try:
        loop = asyncio.get_event_loop()
        noise_queue = asyncio.Queue()
        local_recorder.start(noise_queue=noise_queue, loop=loop)
        print(f"🎙️ Started recording for session {session_id}, launching noise monitor...")
        asyncio.create_task(monitor_startup_noise(session_id))
        recording_msg = "Local PC microphone recording started."
        
        # Schedule auto-stop if duration is set
        if request.scheduled_duration_minutes > 0:
            auto_stop_task = asyncio.create_task(
                auto_stop_session(
                    session_id,
                    request.professor_id,
                    request.scheduled_duration_minutes
                )
            )
            teacher_manager.session_timers[session_id] = auto_stop_task
            teacher_manager.set_active_session(request.professor_id, session_id)
            
    except Exception as e:
        recording_msg = f"Failed to start local recording: {e}"

    # Send session started alert to Express.js
    await add_alert(
        session_id,
        AlertType.SESSION_STARTED,
        f"Session started for {request.course_name}",
        severity="info",
        data={
            "auto_start": request.auto_start,
            "professor_id": request.professor_id,
            "test_video_path": selected_test_video,
            "result_dir": active_sessions[session_id].get("result_dir"),
        }
    )

    return {
        "success": True,
        "session_id": session_id,
        "status": "recording",
        "message": f"Session started. {recording_msg}",
        "test_video_path": selected_test_video,
        "vision_smart_option": request.vision_smart_option,
        "result_dir": active_sessions[session_id].get("result_dir"),
    }

@app.post("/session/stop")
async def stop_session(request: StopSessionRequest, background_tasks: BackgroundTasks):
    """
    POST action called by Express.js when professor ends the lesson.
    Marks session as waiting for recording upload from Raspberry Pi.
    """
    session_id = request.session_id

    if session_id not in active_sessions:
        if request.force:
            return {
                "success": True,
                "session_id": session_id,
                "status": "not_found",
                "message": "Session not found in FastAPI; treated as already stopped."
            }
        raise HTTPException(404, f"Session {session_id} not found")

    session_data = active_sessions[session_id]
    teacher_id = session_data.get("professor_id")

    # Cancel auto-stop timer if exists
    if session_id in teacher_manager.session_timers:
        teacher_manager.session_timers[session_id].cancel()
        del teacher_manager.session_timers[session_id]

    if request.force:
        previous_status = session_data.get("status")
        previous_status_value = (
            previous_status.value
            if isinstance(previous_status, SessionStatus)
            else str(previous_status)
        )

        session_data["status"] = SessionStatus.FAILED
        session_data["stopped_at"] = datetime.utcnow().isoformat()
        session_data["stop_reason"] = request.reason or "force_stop"
        session_data["forced_stop"] = True

        # If recorder is still running, stop it immediately without processing.
        if previous_status == SessionStatus.RECORDING:
            try:
                recording_path = generate_recording_filename(session_data)
                saved_path = local_recorder.stop(recording_path)
                if saved_path:
                    session_data["recording_path"] = saved_path
            except Exception as e:
                print(f"Error force-stopping local recording: {e}")

        if teacher_id:
            if teacher_manager.get_active_session(teacher_id) == session_id:
                teacher_manager.clear_active_session(teacher_id)
            teacher_manager.clear_pending_auto_start(teacher_id)
            await teacher_manager.send_to_teacher(teacher_id, {
                "type": "session_force_stopped",
                "session_id": session_id,
                "message": "Session force-stopped."
            })

        await add_alert(
            session_id,
            AlertType.SESSION_ENDED,
            "Session force-stopped.",
            severity="warning",
            data={
                "reason": request.reason or "force_stop",
                "forced": True,
                "previous_status": previous_status_value,
            }
        )

        return {
            "success": True,
            "session_id": session_id,
            "status": "failed",
            "message": "Session force-stopped."
        }

    # Update session status
    active_sessions[session_id]["status"] = SessionStatus.WAITING_UPLOAD
    active_sessions[session_id]["stopped_at"] = datetime.utcnow().isoformat()
    active_sessions[session_id]["stop_reason"] = request.reason

    processing_message = "Session stopped. Audio processing started from local mic."
    ended_message = "Session ended. Processing audio..."

    # Stop local recording and process
    try:
        session_data = active_sessions[session_id]
        _ensure_session_result_dir(session_id, session_data)
        recording_path = generate_recording_filename(session_data)
        saved_path = local_recorder.stop(recording_path)
        
        if saved_path:
            active_sessions[session_id]["recording_path"] = saved_path
            active_sessions[session_id]["upload_at"] = datetime.utcnow().isoformat()

            selected_video = _pick_test_video_for_session(active_sessions[session_id])

            if selected_video:
                background_tasks.add_task(
                    process_audio_with_test_video_background,
                    session_id,
                    saved_path,
                    selected_video,
                    active_sessions[session_id],
                )
                processing_message = "Session stopped. Audio + test video processing started in parallel."
                ended_message = "Session ended. Processing audio and test video in parallel..."
                await add_alert(
                    session_id,
                    AlertType.RECORDING_RECEIVED,
                    "Local recording stopped, starting parallel audio + test video processing...",
                    severity="info",
                    data={"recording_path": saved_path, "video_path": selected_video},
                )
            else:
                background_tasks.add_task(
                    process_audio_background,
                    session_id,
                    saved_path,
                    active_sessions[session_id]
                )
                await add_alert(
                    session_id,
                    AlertType.RECORDING_RECEIVED,
                    "Local recording stopped, starting audio processing...",
                    severity="info",
                    data={"recording_path": saved_path}
                )
    except Exception as e:
        print(f"Error stopping local recording: {e}")

    # Notify Express.js
    await add_alert(
        session_id,
        AlertType.SESSION_ENDED,
        ended_message,
        severity="info",
        data={
            "reason": request.reason,
            "video_path": active_sessions.get(session_id, {}).get("video_path"),
        }
    )

    return {
        "success": True,
        "session_id": session_id,
        "status": "waiting_upload",
        "message": processing_message,
        "result_dir": active_sessions.get(session_id, {}).get("result_dir"),
        "video_path": active_sessions.get(session_id, {}).get("video_path"),
    }

# -----------------------------------------------------------------------------
# Receive Recording from Raspberry Pi
# -----------------------------------------------------------------------------

@app.post("/recording/upload/{session_id}")
async def receive_recording_from_pi(
    session_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Raspberry Pi sends the recorded audio file here after lesson ends.
    This endpoint receives the file and starts processing.
    """
    # Create session if not exists (for direct upload without start)
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "session_id": session_id,
            "professor_id": "raspberry_pi",
            "timetable_id": None,
            "subject_id": None,
            "subject_title": "Direct Upload",
            "course_name": "Direct Upload",
            "status": SessionStatus.WAITING_UPLOAD,
            "started_at": datetime.utcnow().isoformat(),
            "recording_path": None
        }

    if not file.filename.endswith(('.wav', '.mp3', '.m4a', '.ogg', '.flac')):
        raise HTTPException(400, "Invalid audio format")

    session_data = active_sessions[session_id]
    result_dir = _ensure_session_result_dir(session_id, session_data)

    # Save the recording
    recording_filename = _safe_filename(f"{session_id}_{file.filename}", fallback_stem="recording")
    recording_path = os.path.join(result_dir, recording_filename)

    with open(recording_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    session_data["recording_path"] = recording_path
    session_data["upload_at"] = datetime.utcnow().isoformat()

    # Notify Express.js that recording received
    await add_alert(
        session_id,
        AlertType.RECORDING_RECEIVED,
        "Recording received from Raspberry Pi, starting processing...",
        severity="info",
        data={
            "recording_path": recording_path,
            "file_size_mb": os.path.getsize(recording_path) / (1024 * 1024)
        }
    )

    # Start background processing
    if background_tasks:
        selected_video = _pick_test_video_for_session(session_data)
        if selected_video:
            background_tasks.add_task(
                process_audio_with_test_video_background,
                session_id,
                recording_path,
                selected_video,
                session_data,
            )
        else:
            background_tasks.add_task(
                process_audio_background,
                session_id,
                recording_path,
                session_data
            )

    return {
        "success": True,
        "session_id": session_id,
        "recording_path": recording_path,
        "message": "Recording received, processing started"
    }

# -----------------------------------------------------------------------------
# File Upload (for prototype / pre-recorded files)
# -----------------------------------------------------------------------------

@app.post("/upload/{session_id}")
async def upload_audio(
    session_id: str,
    file: UploadFile = File(...),
    professor_id: Optional[str] = Form(None),
    timetable_id: Optional[str] = Form(None),
    class_id: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    course_name: Optional[str] = Form(None),
    room_id: Optional[str] = Form(None),
    grade_level: int = Form(10),
    student_age: Optional[int] = Form(None),
    vision_smart_option: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
):
    """
    Upload pre-recorded audio file for processing.
    Useful for prototype testing without Raspberry Pi.
    """
    if not file.filename.endswith(('.wav', '.mp3', '.m4a', '.ogg', '.flac')):
        raise HTTPException(400, "Invalid audio format")

    # Create session if not exists
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "session_id": session_id,
            "professor_id": professor_id or "uploaded",
            "timetable_id": timetable_id,
            "class_id": class_id,
            "subject_id": subject_id,
            "subject_title": course_name,
            "course_name": course_name or "Uploaded Recording",
            "room_id": room_id,
            "grade_level": grade_level,
            "student_age": student_age,
            "vision_smart_option": vision_smart_option,
            "status": SessionStatus.PENDING,
            "started_at": datetime.utcnow().isoformat(),
            "recording_path": None,
            "source": "dashboard_upload",
        }

    # Allow metadata updates if session already exists
    session_data = active_sessions[session_id]
    if professor_id:
        session_data["professor_id"] = professor_id
    if timetable_id:
        session_data["timetable_id"] = timetable_id
    if class_id:
        session_data["class_id"] = class_id
    if subject_id:
        session_data["subject_id"] = subject_id
    if course_name:
        session_data["subject_title"] = course_name
        session_data["course_name"] = course_name
    if room_id:
        session_data["room_id"] = room_id
    if grade_level is not None:
        session_data["grade_level"] = grade_level
    if student_age is not None:
        session_data["student_age"] = student_age
    if vision_smart_option:
        session_data["vision_smart_option"] = vision_smart_option

    result_dir = _ensure_session_result_dir(session_id, session_data)

    # Save uploaded file
    upload_filename = _safe_filename(f"{session_id}_{file.filename}", fallback_stem="upload_audio")
    upload_path = os.path.join(result_dir, upload_filename)

    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    session_data["recording_path"] = upload_path
    session_data["status"] = SessionStatus.WAITING_UPLOAD
    session_data["upload_at"] = datetime.utcnow().isoformat()

    # Start processing
    if background_tasks:
        selected_video = _pick_test_video_for_session(session_data)
        if selected_video:
            background_tasks.add_task(
                process_audio_with_test_video_background,
                session_id,
                upload_path,
                selected_video,
                session_data,
            )
        else:
            background_tasks.add_task(
                process_audio_background,
                session_id,
                upload_path,
                session_data
            )

    return {
        "success": True,
        "session_id": session_id,
        "audio_path": upload_path,
        "message": "Upload successful, processing started"
    }


@app.post("/video/upload/{session_id}")
async def upload_video(
    session_id: str,
    file: UploadFile = File(...),
    professor_id: Optional[str] = Form(None),
    timetable_id: Optional[str] = Form(None),
    class_id: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    course_name: Optional[str] = Form(None),
    room_id: Optional[str] = Form(None),
    grade_level: int = Form(10),
    student_age: Optional[int] = Form(None),
    vision_smart_option: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
):
    """Upload a video, then run audio + vision analysis in parallel."""
    filename = os.path.basename(file.filename or "")
    if not filename:
        raise HTTPException(400, "Missing video filename")
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in VIDEO_EXTENSIONS:
        raise HTTPException(400, "Invalid video format")

    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "session_id": session_id,
            "professor_id": professor_id or "uploaded",
            "timetable_id": timetable_id,
            "class_id": class_id,
            "subject_id": subject_id,
            "subject_title": course_name,
            "course_name": course_name or "Uploaded Video",
            "room_id": room_id,
            "grade_level": grade_level,
            "student_age": student_age,
            "vision_smart_option": vision_smart_option,
            "status": SessionStatus.PENDING,
            "started_at": datetime.utcnow().isoformat(),
            "recording_path": None,
            "video_path": None,
            "source": "video_upload",
        }

    session_data = active_sessions[session_id]
    if professor_id:
        session_data["professor_id"] = professor_id
    if timetable_id:
        session_data["timetable_id"] = timetable_id
    if class_id:
        session_data["class_id"] = class_id
    if subject_id:
        session_data["subject_id"] = subject_id
    if course_name:
        session_data["subject_title"] = course_name
        session_data["course_name"] = course_name
    if room_id:
        session_data["room_id"] = room_id
    if grade_level is not None:
        session_data["grade_level"] = grade_level
    if student_age is not None:
        session_data["student_age"] = student_age
    if vision_smart_option:
        session_data["vision_smart_option"] = vision_smart_option

    result_dir = _ensure_session_result_dir(session_id, session_data)
    video_filename = _safe_filename(f"{session_id}_{filename}", fallback_stem="upload_video")
    video_path = os.path.join(result_dir, video_filename)
    with open(video_path, "wb") as fh:
        shutil.copyfileobj(file.file, fh)

    session_data["video_path"] = video_path
    session_data["status"] = SessionStatus.WAITING_UPLOAD
    session_data["upload_at"] = datetime.utcnow().isoformat()

    await add_alert(
        session_id,
        AlertType.RECORDING_RECEIVED,
        "Video received, starting audio + vision processing...",
        severity="info",
        data={
            "video_path": video_path,
            "file_size_mb": os.path.getsize(video_path) / (1024 * 1024),
        },
    )

    if background_tasks:
        background_tasks.add_task(
            process_video_background,
            session_id,
            video_path,
            session_data,
        )

    return {
        "success": True,
        "session_id": session_id,
        "video_path": video_path,
        "message": "Video upload successful, parallel processing started",
    }


@app.post("/video/test/{session_id}")
async def analyze_test_video(
    session_id: str,
    filename: str = Form(...),
    professor_id: Optional[str] = Form(None),
    timetable_id: Optional[str] = Form(None),
    class_id: Optional[str] = Form(None),
    subject_id: Optional[str] = Form(None),
    course_name: Optional[str] = Form(None),
    room_id: Optional[str] = Form(None),
    grade_level: int = Form(10),
    student_age: Optional[int] = Form(None),
    vision_smart_option: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
):
    """Analyze a video already placed inside video_test_inputs/."""
    safe_name = os.path.basename(filename)
    if safe_name != filename:
        raise HTTPException(400, "Invalid filename")

    file_ext = os.path.splitext(safe_name)[1].lower()
    if file_ext not in VIDEO_EXTENSIONS:
        raise HTTPException(400, "Invalid video format")

    video_path = os.path.abspath(os.path.join(VIDEO_TEST_INPUT_DIR, safe_name))
    test_root = os.path.abspath(VIDEO_TEST_INPUT_DIR)
    if not video_path.startswith(test_root):
        raise HTTPException(400, "Invalid test video path")
    if not os.path.exists(video_path):
        raise HTTPException(404, f"Test video not found: {safe_name}")

    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "session_id": session_id,
            "professor_id": professor_id or "test_video",
            "timetable_id": timetable_id,
            "class_id": class_id,
            "subject_id": subject_id,
            "subject_title": course_name,
            "course_name": course_name or "Test Video",
            "room_id": room_id,
            "grade_level": grade_level,
            "student_age": student_age,
            "vision_smart_option": vision_smart_option,
            "status": SessionStatus.PENDING,
            "started_at": datetime.utcnow().isoformat(),
            "recording_path": None,
            "video_path": video_path,
            "source": "video_test_folder",
        }

    session_data = active_sessions[session_id]
    if professor_id:
        session_data["professor_id"] = professor_id
    if timetable_id:
        session_data["timetable_id"] = timetable_id
    if class_id:
        session_data["class_id"] = class_id
    if subject_id:
        session_data["subject_id"] = subject_id
    if course_name:
        session_data["subject_title"] = course_name
        session_data["course_name"] = course_name
    if room_id:
        session_data["room_id"] = room_id
    if grade_level is not None:
        session_data["grade_level"] = grade_level
    if student_age is not None:
        session_data["student_age"] = student_age
    if vision_smart_option:
        session_data["vision_smart_option"] = vision_smart_option

    _ensure_session_result_dir(session_id, session_data)

    session_data["video_path"] = video_path
    session_data["status"] = SessionStatus.WAITING_UPLOAD
    session_data["upload_at"] = datetime.utcnow().isoformat()

    await add_alert(
        session_id,
        AlertType.RECORDING_RECEIVED,
        "Test video selected, starting audio + vision processing...",
        severity="info",
        data={"video_path": video_path},
    )

    if background_tasks:
        background_tasks.add_task(
            process_video_background,
            session_id,
            video_path,
            session_data,
        )

    return {
        "success": True,
        "session_id": session_id,
        "video_path": video_path,
        "message": "Test video accepted, parallel processing started",
    }


@app.get("/video/test/files")
async def list_test_videos():
    """List test videos available in video_test_inputs/."""
    files = []
    for name in os.listdir(VIDEO_TEST_INPUT_DIR):
        ext = os.path.splitext(name)[1].lower()
        if ext not in VIDEO_EXTENSIONS:
            continue
        full_path = os.path.join(VIDEO_TEST_INPUT_DIR, name)
        if not os.path.isfile(full_path):
            continue
        files.append({
            "name": name,
            "sizeMb": round(os.path.getsize(full_path) / (1024 * 1024), 2),
        })

    return {
        "folder": VIDEO_TEST_INPUT_DIR,
        "count": len(files),
        "files": sorted(files, key=lambda item: item["name"].lower()),
    }

# -----------------------------------------------------------------------------
# Session Data
# -----------------------------------------------------------------------------

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session data and status."""
    if session_id not in active_sessions:
        raise HTTPException(404, f"Session {session_id} not found")

    session = active_sessions[session_id]
    result = session_results.get(session_id)

    return {
        "session": session,
        "result": result,
        "alerts": [a.model_dump() for a in session_alerts.get(session_id, [])]
    }

@app.get("/session/{session_id}/alerts")
async def get_session_alerts(session_id: str):
    """Get all alerts for a session."""
    return {"alerts": [a.model_dump() for a in session_alerts.get(session_id, [])]}

@app.get("/session/{session_id}/result")
async def get_session_result(session_id: str):
    """Get processing result for a session."""
    if session_id not in session_results:
        raise HTTPException(404, f"Result for session {session_id} not found")
    return session_results[session_id]

@app.get("/sessions")
async def list_sessions():
    """List all sessions."""
    return {
        "active": active_sessions,
        "completed": list(session_results.keys())
    }

# -----------------------------------------------------------------------------
# Session Analysis (Admin trigger)
# -----------------------------------------------------------------------------

def _summarize_engagement(score: Optional[float], band: Optional[str]) -> str:
    if score is None:
        return "Engagement score unavailable."
    score_value = float(score)
    if band:
        return f"Engagement is {band} ({score_value:.1f}/100)."
    if score_value >= 75:
        return f"Engagement is high ({score_value:.1f}/100)."
    if score_value >= 50:
        return f"Engagement is moderate ({score_value:.1f}/100)."
    return f"Engagement is low ({score_value:.1f}/100)."


def _summarize_stress(score: Optional[float], band: Optional[str]) -> str:
    if score is None:
        return "Stress indicators unavailable."
    score_value = float(score)
    if band:
        return f"Stress indicators are {band} ({score_value:.1f}/100)."
    if score_value >= 70:
        return f"Stress indicators are high ({score_value:.1f}/100)."
    if score_value >= 45:
        return f"Stress indicators are moderate ({score_value:.1f}/100)."
    return f"Stress indicators are low ({score_value:.1f}/100)."


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(number) or math.isinf(number):
        return default
    return number


def _pick_value(payload: Dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            return payload.get(key)
    return None


async def check_missed_session(teacher_id: str) -> Optional[Dict[str, Any]]:
    """Check for a session that ended within 10 minutes without auto start."""
    timetable = await fetch_teacher_timetable(teacher_id)
    if not timetable:
        return None

    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute
    current_day = now.strftime("%A").upper()

    for entry in timetable:
        entry_day = entry.get("day", "").upper()
        if entry_day != current_day:
            continue

        end_minutes = parse_time_to_minutes(entry.get("endTime", ""))
        if end_minutes < 0:
            continue

        diff = current_minutes - end_minutes
        if 0 <= diff <= 10:
            return entry

    return None


async def notify_session_missed(teacher_id: str, timetable_entry: Dict[str, Any]):
    try:
        await teacher_manager.send_to_teacher(teacher_id, {
            "type": "session_missed",
            "message": "A scheduled session just ended without starting.",
            "timetable": timetable_entry,
        })
    except Exception:
        pass

    session_id = f"missed_{teacher_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    await send_to_express_webhook(WebhookPayload(
        event="alert",
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat(),
        data={
            "alert_type": "session_ended",
            "session_id": session_id,
            "message": "Scheduled session missed (auto start did not occur).",
            "severity": "warning",
            "data": {
                "timetable_id": timetable_entry.get("id"),
                "class_id": timetable_entry.get("classId"),
                "subject_id": timetable_entry.get("subjectId"),
                "missed": True,
            },
        },
    ))


def _collect_alerts(metrics: Dict[str, Any], alert_flags: Dict[str, Any]) -> List[Dict[str, Any]]:
    alerts: List[Dict[str, Any]] = []
    if alert_flags.get("teacher_dominating"):
        alerts.append({
            "type": "TEACHER_DOMINATING",
            "severity": "WARNING",
            "message": "Teacher talk time dominates the session.",
        })
    if alert_flags.get("long_silence_found"):
        longest = alert_flags.get("longest_silence_sec", 0)
        alerts.append({
            "type": "LONG_SILENCE",
            "severity": "INFO",
            "message": f"Long silence detected ({longest:.1f}s).",
        })

    wait_times = metrics.get("wait_times", {}) if isinstance(metrics, dict) else {}
    if wait_times:
        avg_wait = wait_times.get("avg_teacher_to_student_wait", 0)
        if avg_wait >= 6:
            alerts.append({
                "type": "SLOW_STUDENT_RESPONSE",
                "severity": "INFO",
                "message": f"Average wait time is {avg_wait:.1f}s.",
            })

    overlap = metrics.get("overlap", {}) if isinstance(metrics, dict) else {}
    if overlap:
        overlap_ratio = overlap.get("overlap_ratio", 0)
        if overlap_ratio >= 0.15:
            alerts.append({
                "type": "OVERLAP_CROSSTALK",
                "severity": "WARNING",
                "message": "High overlapping speech detected.",
            })

    pace = metrics.get("speaking_pace", {}) if isinstance(metrics, dict) else {}
    if pace and pace.get("teacher_consistently_fast"):
        alerts.append({
            "type": "FAST_PACING",
            "severity": "INFO",
            "message": "Teacher pacing is consistently fast.",
        })

    return alerts


def _compute_stress(metrics: Dict[str, Any]) -> Dict[str, Any]:
    overlap = metrics.get("overlap", {}) if isinstance(metrics, dict) else {}
    interruptions = metrics.get("interruptions", {}) if isinstance(metrics, dict) else {}
    pace = metrics.get("speaking_pace", {}) if isinstance(metrics, dict) else {}
    energy = metrics.get("energy", {}) if isinstance(metrics, dict) else {}
    wait_times = metrics.get("wait_times", {}) if isinstance(metrics, dict) else {}

    overlap_ratio = _safe_float(overlap.get("overlap_ratio"))
    interruptions_count = sum(_safe_float(value) for value in interruptions.values())
    fast_ratio = _safe_float(pace.get("teacher_fast_segment_ratio"))
    high_energy_count = _safe_float(energy.get("high_energy_zone_count"))
    avg_wait = _safe_float(wait_times.get("avg_teacher_to_student_wait"))

    overlap_score = min(overlap_ratio / 0.2, 1.0) * 35.0
    interruption_score = min(interruptions_count / 8.0, 1.0) * 25.0
    pace_score = min(fast_ratio, 1.0) * 20.0
    energy_score = min(high_energy_count / 6.0, 1.0) * 20.0

    score = overlap_score + interruption_score + pace_score + energy_score
    if avg_wait >= 6.0:
        score += 5.0

    score = max(0.0, min(100.0, round(score, 1)))

    if score >= 70:
        band = "high"
    elif score >= 45:
        band = "medium"
    else:
        band = "low"

    return {
        "score": score,
        "band": band,
        "summary": _summarize_stress(score, band),
    }


def _build_session_analysis(session_payload: Dict[str, Any]) -> Dict[str, Any]:
    advanced_metrics = session_payload.get("advanced_metrics") or session_payload.get("advancedMetrics") or {}
    engagement = advanced_metrics.get("engagement_score", {}) if isinstance(advanced_metrics, dict) else {}
    engagement_score = engagement.get("score") if isinstance(engagement, dict) else None
    engagement_band = engagement.get("band") if isinstance(engagement, dict) else None
    alert_flags = session_payload.get("alert_flags") or session_payload.get("alertFlags") or {}
    if not isinstance(alert_flags, dict):
        alert_flags = {}

    alerts = _collect_alerts(advanced_metrics, alert_flags)
    stress = _compute_stress(advanced_metrics)

    talking_balance = advanced_metrics.get("turn_taking", {}).get("teacher_to_teacher_ratio")
    wait_times = advanced_metrics.get("wait_times", {})
    interruptions = advanced_metrics.get("interruptions", {})
    overlap = advanced_metrics.get("overlap", {})
    pace = advanced_metrics.get("speaking_pace", {})

    analysis = {
        "sessionId": _pick_value(session_payload, "session_id", "sessionId"),
        "engagementScore": engagement_score,
        "engagementBand": engagement_band,
        "summary": _summarize_engagement(engagement_score, engagement_band),
        "stressScore": stress["score"],
        "stressBand": stress["band"],
        "stressSummary": stress["summary"],
        "signals": {
            "teacherRatio": _pick_value(session_payload, "teacher_ratio", "teacherRatio"),
            "studentRatio": _pick_value(session_payload, "student_ratio", "studentRatio"),
            "teacherMinutes": _pick_value(session_payload, "teacher_minutes", "teacherMinutes"),
            "studentMinutes": _pick_value(session_payload, "student_minutes", "studentMinutes"),
        },
        "metrics": {
            "talkBalance": talking_balance,
            "waitTimes": wait_times,
            "interruptions": interruptions,
            "overlap": overlap,
            "speakingPace": pace,
            "sessionPhases": advanced_metrics.get("session_phases"),
            "energy": advanced_metrics.get("energy"),
        },
        "alerts": alerts,
    }

    return analysis


@app.post("/session/analyze")
async def analyze_session(request: AnalyzeSessionRequest):
    """
    Analyze a processed session and return a condensed summary.
    """
    session_id = request.session_id

    payload: Optional[Dict[str, Any]] = None
    if request.session_json_path:
        try:
            with open(request.session_json_path, "r", encoding="utf-8") as fh:
                payload = json.load(fh)
        except Exception as exc:
            raise HTTPException(404, f"Session JSON not found: {exc}") from exc

    if payload is None:
        payload = session_results.get(session_id)

    if payload is None:
        raise HTTPException(404, f"Session {session_id} not found")

    analysis = _build_session_analysis(payload)
    return {
        "success": True,
        "analysis": analysis,
    }

# -----------------------------------------------------------------------------
# Real-time WebSocket
# -----------------------------------------------------------------------------

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket for real-time updates.
    Connect from Express.js/Next.js to receive live progress and alerts.
    """
    await manager.connect(websocket, session_id)

    try:
        # Send current session state
        if session_id in active_sessions:
            await websocket.send_json({
                "type": "session_state",
                "session": active_sessions[session_id],
                "alerts": [a.model_dump() for a in session_alerts.get(session_id, [])]
            })

        # Keep connection alive and receive messages
        while True:
            data = await websocket.receive_json()

            # Handle ping/pong
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

            # Handle status request
            elif data.get("type") == "get_status":
                if session_id in active_sessions:
                    await websocket.send_json({
                        "type": "status",
                        "session": active_sessions[session_id],
                        "result": session_results.get(session_id)
                    })

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)

# -----------------------------------------------------------------------------
# Teacher WebSocket - For auto-start/stop notifications
# -----------------------------------------------------------------------------

@app.websocket("/ws/teacher/{teacher_id}")
async def teacher_websocket_endpoint(websocket: WebSocket, teacher_id: str):
    """
    WebSocket for teacher dashboard.
    - On connect: Check timetable for upcoming sessions
    - If session is scheduled soon: Send alert and countdown for auto-start
    - During session: Send auto-stop countdown when time is up
    """
    await teacher_manager.connect(websocket, teacher_id)
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "teacher_id": teacher_id,
            "message": "Connected to Learno AI",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Check for upcoming sessions on connect
        upcoming_session = await check_upcoming_session(teacher_id)
        if upcoming_session:
            timetable_id = upcoming_session.get("id")
            can_schedule_auto_start = (
                not has_teacher_live_session(teacher_id)
                and not teacher_manager.has_any_pending_auto_start(teacher_id)
                and not (
                    timetable_id
                    and teacher_manager.has_pending_auto_start(teacher_id, timetable_id)
                )
            )
            if can_schedule_auto_start:
                # Session starting soon - initiate auto-start
                await websocket.send_json({
                    "type": "upcoming_session",
                    "message": "You have a session starting now!",
                    "timetable": upcoming_session
                })
                # Start the countdown in background
                asyncio.create_task(auto_start_countdown(teacher_id, upcoming_session))
        else:
            missed_session = await check_missed_session(teacher_id)
            if missed_session:
                await notify_session_missed(teacher_id, missed_session)
        
        # Check if teacher has an active session
        active_session_id = teacher_manager.get_active_session(teacher_id)
        if active_session_id and active_session_id in active_sessions:
            await websocket.send_json({
                "type": "active_session",
                "session_id": active_session_id,
                "session": active_sessions[active_session_id]
            })
        
        # Keep connection alive and receive messages
        while True:
            data = await websocket.receive_json()
            
            # Handle ping/pong
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                upcoming = await check_upcoming_session(teacher_id)
                if upcoming:
                    timetable_id = upcoming.get("id")
                    can_schedule_auto_start = (
                        not has_teacher_live_session(teacher_id)
                        and not teacher_manager.has_any_pending_auto_start(teacher_id)
                        and not (
                            timetable_id
                            and teacher_manager.has_pending_auto_start(teacher_id, timetable_id)
                        )
                    )
                    if can_schedule_auto_start:
                        await websocket.send_json({
                            "type": "upcoming_session",
                            "message": "You have a session starting now!",
                            "timetable": upcoming,
                        })
                        asyncio.create_task(auto_start_countdown(teacher_id, upcoming))
                else:
                    missed = await check_missed_session(teacher_id)
                    if missed:
                        await notify_session_missed(teacher_id, missed)
            
            # Handle manual session start
            elif data.get("type") == "start_session":
                # Teacher can manually trigger session start from WS
                await websocket.send_json({
                    "type": "ack",
                    "message": "Use POST /session/start endpoint"
                })
            
            # Handle manual session stop
            elif data.get("type") == "stop_session":
                session_id = data.get("session_id")
                if session_id:
                    # Cancel auto-stop timer
                    if session_id in teacher_manager.session_timers:
                        teacher_manager.session_timers[session_id].cancel()
                    await websocket.send_json({
                        "type": "ack",
                        "message": "Use POST /session/stop endpoint"
                    })
            
            # Handle cancel auto-start
            elif data.get("type") == "cancel_auto_start":
                teacher_manager.clear_pending_auto_start(teacher_id)
                await websocket.send_json({
                    "type": "auto_start_cancelled",
                    "message": "Auto-start cancelled"
                })
            
            # Handle extend session (prevent auto-stop)
            elif data.get("type") == "extend_session":
                session_id = data.get("session_id")
                extend_minutes = data.get("minutes", 15)
                
                if session_id in teacher_manager.session_timers:
                    # Cancel current timer
                    teacher_manager.session_timers[session_id].cancel()
                    
                    # Create new timer with extended duration
                    new_task = asyncio.create_task(
                        auto_stop_session(session_id, teacher_id, extend_minutes)
                    )
                    teacher_manager.session_timers[session_id] = new_task
                    
                    await websocket.send_json({
                        "type": "session_extended",
                        "session_id": session_id,
                        "extended_minutes": extend_minutes,
                        "message": f"Session extended by {extend_minutes} minutes"
                    })
            
            # Check for upcoming/missed sessions
            elif data.get("type") == "check_timetable":
                upcoming = await check_upcoming_session(teacher_id)
                missed = await check_missed_session(teacher_id)
                await websocket.send_json({
                    "type": "timetable_check",
                    "upcoming_session": upcoming,
                    "missed_session": missed,
                })
                if missed:
                    await notify_session_missed(teacher_id, missed)
    
    except WebSocketDisconnect:
        teacher_manager.disconnect(teacher_id)
        
    except Exception as e:
        print(f"Teacher WebSocket error for {teacher_id}: {e}")
        teacher_manager.disconnect(teacher_id)

# -----------------------------------------------------------------------------
# Timetable Integration
# -----------------------------------------------------------------------------

@app.get("/timetable/current")
async def get_current_timetable():
    """
    Get current/upcoming sessions from timetable.
    This would be called by Express.js or the system to check schedules.
    """
    # TODO: Implement database query
    # For now return mock data
    return {
        "current_time": datetime.utcnow().isoformat(),
        "sessions": [
            {
                "id": "tt_001",
                "professor_id": "prof_123",
                "course_name": "Machine Learning",
                "room": "A101",
                "start_time": "09:00",
                "end_time": "10:30",
                "status": "scheduled"
            }
        ]
    }

# =============================================================================
# Run
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
