# Learno Raspberry Pi 5 Node

This folder contains Raspberry Pi 5 sensor scripts that publish telemetry to the Learno IoT server.

## Scripts

- `microphone.py` - reads MQ-7 analog values and publishes `mq7Raw`, `mq7Voltage`, `mq7LevelPct`, and `co2Ppm`.
- `camera.py` - captures camera frames and publishes brightness/motion-derived metrics to telemetry.

## Prerequisites (Raspberry Pi 5)

- Raspberry Pi OS with Python 3
- Network access to telemetry server
- Camera connected and enabled (for `camera.py`)
- MQ-7 connected through a valid ADC input path (for `microphone.py`)

Install Python packages:

```bash
cd learno-iot/raspberry-pi5
python3 -m pip install --upgrade pip
python3 -m pip install opencv-python numpy
```

## Configure server destination

In both `camera.py` and `microphone.py`, set:

- `API_HOST` = server machine IP
- `API_PORT` = `3001`
- `API_PATH` = `/api/telemetry`

## Run MQ-7 telemetry

```bash
cd learno-iot/raspberry-pi5
python3 microphone.py
```

The script performs warm-up and then sends periodic telemetry.

## Run camera telemetry and capture

Continuous stream:

```bash
cd learno-iot/raspberry-pi5
python3 camera.py stream
```

Single capture:

```bash
cd learno-iot/raspberry-pi5
python3 camera.py capture classroom.jpg
```

## Integration behavior

- Payloads are sent to the same API as ESP32 (`POST /api/telemetry`).
- Data appears in latest/history endpoints from the server.
- Device IDs identify each source node independently.
