# Learno IoT - ESP32 + Raspberry Pi 5 (Production Flow)

Learno IoT runs a complete classroom sensing pipeline:

- ESP32 nodes read environmental sensors (light + MQ-7 + DHT22 support).
- Raspberry Pi 5 runs camera and microphone-side acquisition.
- All devices send telemetry to the IoT server.
- The AI service processes classroom media and produces analysis outputs.

This setup is designed as a full workflow where ESP32 and Raspberry Pi 5 are both active components.

## Architecture

```text
ESP32 Node 1 (firmware/)  --->
                              \
ESP32 Node 2 (esp2/)      ----->  learno-iot/server (API + dashboard)
                              /
Raspberry Pi 5 (camera+mic) ->

learno-iot/server + media files -> learno-ai (FastAPI AI pipeline)
```

## Repository map

```text
learno-iot/
|- firmware/            # ESP32 node 1 firmware (learno-esp32-01)
|- esp2/                # ESP32 node 2 firmware (learno-esp32-02)
|- server/              # Telemetry API and live dashboard
|- raspberry-pi5/       # Camera + microphone scripts for Raspberry Pi 5
|- tools/cp210x-driver/ # CP210x Windows USB driver installers
```

## Data captured by devices

### ESP32 nodes

- `lightLux` from BH1750
- `mq7Raw`, `mq7Voltage`, `mq7LevelPct` from MQ-7 analog sensor
- `co2Ppm` computed from MQ-7 level trend
- health fields in `sensorTests` and `systemTests`

### Raspberry Pi 5 node

- Camera stream metrics (brightness, motion, color ratios)
- MQ-7 side telemetry from microphone/analog path script
- device identity and system status fields compatible with server payload format

## Prerequisites

### Host machine (server + ESP32 flashing)

- Node.js 20+
- Python 3.10+
- PlatformIO (`python -m pip install platformio`)
- CP210x USB driver (`tools/cp210x-driver/CP210xVCPInstaller_x64.exe`)

### Raspberry Pi 5

- Raspberry Pi OS
- Python 3
- Network connectivity to IoT server
- Camera enabled for `camera.py`

### Hardware

- 1-2 ESP32 DevKit boards
- BH1750 light sensor
- MQ-7 analog sensor
- DHT22 sensor (if used in your board wiring)
- Raspberry Pi 5 with camera and microphone/ADC setup

## Step 1 - Start IoT server

```powershell
cd learno-iot/server
npm install
npm run start:3001
```

Server endpoints:

- `POST /api/telemetry`
- `GET /api/health`
- `GET /api/latest`
- `GET /api/history?limit=30`

Server URL: `http://localhost:3001`

## Step 2 - Configure ESP32 node 1 (`firmware/`)

```powershell
cd learno-iot
copy firmware\include\secrets.example.h firmware\include\secrets.h
```

Edit `firmware/include/secrets.h`:

```cpp
constexpr char WIFI_SSID[] = "YourWiFiName";
constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
constexpr char API_HOST[] = "192.168.1.100";
```

## Step 3 - Configure ESP32 node 2 (`esp2/`)

Edit `esp2/include/secrets.h`:

```cpp
constexpr char WIFI_SSID[] = "YourWiFiName";
constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
constexpr char API_HOST[] = "192.168.1.100";
```

Default endpoint in both firmwares:

- `API_PORT = 3001`
- `API_PATH = /api/telemetry`

## Step 4 - Build and flash ESP32 nodes

List serial ports:

```powershell
python -m platformio device list
```

Flash node 1:

```powershell
cd learno-iot/firmware
python -m platformio run
python -m platformio run --target upload --upload-port COM3
python -m platformio device monitor --port COM3 --baud 115200
```

Flash node 2:

```powershell
cd learno-iot/esp2
python -m platformio run
python -m platformio run --target upload --upload-port COM4
python -m platformio device monitor --port COM4 --baud 115200
```

Replace COM ports with the actual board ports.

## Step 5 - Run Raspberry Pi 5 node (required)

See full guide: `raspberry-pi5/README.md`

Quick run:

```bash
cd learno-iot/raspberry-pi5
python3 -m pip install --upgrade pip
python3 -m pip install opencv-python numpy
python3 microphone.py
python3 camera.py stream
```

## Step 6 - Run AI service and get outputs

The AI service is in `../learno-ai` and processes classroom audio/video into analysis outputs.

Start AI service:

```powershell
cd ..\learno-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn api:app --reload --port 8000
```

AI output endpoints include:

- `GET http://localhost:8000/health`
- `GET http://localhost:8000/sessions`
- `GET http://localhost:8000/session/{session_id}/result`
- `GET http://localhost:8000/session/{session_id}/alerts`

## ESP32 default pin map

- BH1750 SDA: GPIO21
- BH1750 SCL: GPIO22
- DHT22 data: GPIO4
- MQ-7 analog output: GPIO34

## Verification checklist

- IoT server health returns `ok: true`.
- ESP32 serial monitor shows Wi-Fi connected and telemetry POST status.
- Raspberry Pi 5 scripts run and push telemetry to `/api/telemetry`.
- `GET /api/latest` shows fresh readings from active devices.
- AI service health endpoint is up and session outputs are reachable.
