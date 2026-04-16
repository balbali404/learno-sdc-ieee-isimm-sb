# Learno Raspberry Pi 5 - Camera + Microphone + AI Flow

Raspberry Pi 5 is a required runtime node in this IoT setup.

It runs camera and microphone-side acquisition scripts, sends telemetry to the IoT server, and provides media inputs for the AI pipeline.

## Runtime role

- Run `camera.py` for continuous camera capture/analysis.
- Run `microphone.py` for periodic MQ-7 based environmental telemetry.
- Send data to `learno-iot/server` (`POST /api/telemetry`).
- Feed media and session context to the AI service (`learno-ai`) for analysis outputs.

## Prerequisites

- Raspberry Pi 5 with Raspberry Pi OS
- Python 3
- Enabled camera interface
- Network route to IoT server and AI service

Install dependencies:

```bash
cd learno-iot/raspberry-pi5
python3 -m pip install --upgrade pip
python3 -m pip install opencv-python numpy
```

## Configure destination host

In both scripts, set:

- `API_HOST` = IoT server IP
- `API_PORT` = `3001`
- `API_PATH` = `/api/telemetry`

Files to edit:

- `camera.py`
- `microphone.py`

## Run microphone path

```bash
cd learno-iot/raspberry-pi5
python3 microphone.py
```

This process starts sensor warm-up, then continuously publishes telemetry payloads.

## Run camera path

Continuous runtime:

```bash
cd learno-iot/raspberry-pi5
python3 camera.py stream
```

Single capture output:

```bash
cd learno-iot/raspberry-pi5
python3 camera.py capture classroom.jpg
```

## Connect with AI and get outputs

1. Keep IoT server running on port `3001`.
2. Keep Raspberry Pi 5 scripts running.
3. Start AI service from `learno-ai` on port `8000`.
4. Send/record session media through AI endpoints.
5. Read AI outputs from session result endpoints.

AI output endpoints:

- `GET http://<ai-host>:8000/health`
- `GET http://<ai-host>:8000/sessions`
- `GET http://<ai-host>:8000/session/{session_id}/result`
- `GET http://<ai-host>:8000/session/{session_id}/alerts`

## Validation

- IoT server `GET /api/latest` shows Raspberry Pi 5 device data.
- IoT server `GET /api/history` includes continuous updates.
- AI service endpoints return active sessions and analysis outputs.
