# Learno AI Service

`learno-ai` is the FastAPI service responsible for classroom AI processing in Learno.

It handles audio/video analysis, session intelligence, lesson/advice generation, and webhook delivery to the backend.

## What this service does

- Starts and stops session lifecycle jobs requested by backend.
- Processes classroom audio (diarization, speaker ratios, silence, advanced metrics).
- Transcribes teacher audio with Faster-Whisper.
- Runs vision analysis for engagement/video outputs (YOLO + optional enhanced tracking).
- Generates AI lesson and advice outputs for the platform.
- Sends processing events/results to backend webhook.
- Streams real-time status and alerts via WebSocket channels.

## Functional architecture

```text
FastAPI (api.py)
|- Session control endpoints
|- Upload endpoints (audio/video/test video)
|- Processing orchestration (audio + vision)
|- Webhook sender to backend
|- WebSocket channels (session + teacher)

Core modules
|- diarization/     -> pyannote-based speaker diarization and metrics
|- transcription/   -> faster-whisper transcription + transcript tooling
|- vision/          -> YOLO video engagement analysis
|- gemini/          -> lesson/advice generation and PDF/JSON outputs
|- tools/           -> local recording helpers
|- utils/           -> media utility helpers
```

## End-to-end processing flow

1. Backend triggers session start (`/session/start`).
2. AI service records or receives uploaded media.
3. Audio and vision pipelines run (parallel when applicable).
4. AI outputs are composed (metrics, transcript, lesson/advice files, alerts).
5. Service posts webhook events to backend (`/api/learno/webhook`).
6. Backend persists and broadcasts updates to dashboards.

## Main endpoints

### Health and status

- `GET /`
- `GET /health`
- `GET /sessions`
- `GET /session/{session_id}`
- `GET /session/{session_id}/alerts`
- `GET /session/{session_id}/result`

### Session lifecycle

- `POST /session/start`
- `POST /session/stop`
- `POST /session/analyze`

### Upload and processing

- `POST /recording/upload/{session_id}`
- `POST /upload/{session_id}`
- `POST /video/upload/{session_id}`
- `POST /video/test/{session_id}`
- `GET /video/test/files`

### Files and realtime

- `GET /files/{file_path:path}`
- `WS /ws/{session_id}`
- `WS /ws/teacher/{teacher_id}`

## Key models and runtime dependencies

- **Diarization:** `pyannote/speaker-diarization-3.1`, `pyannote/embedding`
- **Transcription:** Faster-Whisper (`large-v3-turbo` default)
- **Vision:** YOLO model (default local path; configurable)
- **Generation:** Gemini APIs (lesson/advice generation)
- **Runtime stack:** FastAPI, Uvicorn, Torch, OpenCV, NumPy, SoundFile, HTTPX, WebSockets

## Folder and file guide

- `api.py`: primary FastAPI app, routing, orchestration, webhook sending, websocket handling.
- `main.py`: CLI entry for local/offline processing workflows.
- `diarization/`: speaker diarization and classroom interaction metrics.
- `transcription/`: transcription and transcript export helpers.
- `vision/`: video engagement analysis utilities.
- `gemini/`: lesson/advice generation configuration and prompt pipelines.
- `models/`: local model artifacts and weights cache.
- `recordings/`, `uploads/`, `video_uploads/`, `results/`: runtime artifacts.

## Setup

### Prerequisites

- **Python 3.13.0** (required - use exactly this version)
- FFmpeg available in PATH (recommended for media conversion)
- GPU optional (service can run on CPU)

> **Note:** This project requires Python 3.13.0 specifically. Using a different version may cause compatibility issues.

### Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Configuration

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Edit `.env` and fill in your API keys:

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `HF_TOKEN` | HuggingFace access token | [HuggingFace Settings](https://huggingface.co/settings/tokens) |
| `EXPRESS_WEBHOOK_KEY` | Secret for backend webhook | Set the same value in backend `.env` |

3. The remaining variables can be left as defaults for local development.

### Run

```bash
uvicorn api:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Integration contract with backend

- Backend module: `learno-web/backend/src/modules/learno`
- Webhook target (default in AI service): `http://localhost:4000/api/learno/webhook`
- Expected shared secret header: `Authorization: Bearer <WEBHOOK_SECRET>`

Ensure backend and AI webhook credentials/URLs are aligned in environment configuration.

## Security and environment notes

- All secrets are configured via environment variables (see `.env.example`).
- The `.env` file is excluded from Git - never commit secrets.
- For production: ensure CORS, webhook secrets, and file-serving are properly restricted.
