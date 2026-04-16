# Learno IoT

Learno IoT is the hardware telemetry layer of the project. It supports ESP32 devices for classroom sensing and optional Raspberry Pi 5 sensor nodes, all reporting to the same telemetry server.

## Folder structure

```text
learno-iot/
|- firmware/         # ESP32 node 1 firmware (learno-esp32-01)
|- esp2/             # ESP32 node 2 firmware (learno-esp32-02)
|- server/           # Node.js telemetry API + web dashboard
|- raspberry-pi5/    # Raspberry Pi 5 sensor scripts
|- tools/            # USB driver installers (CP210x)
```

## What the system captures

- `lightLux` from BH1750 light sensor
- `mq7Raw`, `mq7Voltage`, `mq7LevelPct` from MQ-7 analog sensor
- `co2Ppm` estimated from MQ-7 trend model
- optional `temperatureC` and `humidityPct` from DHT22
- sensor and connectivity status in `sensorTests` and `systemTests`

## Prerequisites

### Windows host (server + ESP32 flashing)

- Node.js 20+
- Python 3.10+
- PlatformIO (`python -m pip install platformio`)
- CP210x driver (`tools/cp210x-driver/CP210xVCPInstaller_x64.exe`)

### Hardware

- ESP32 DevKit board (one or two)
- BH1750 (I2C light sensor)
- MQ-7 (analog gas sensor)
- Optional DHT22
- Optional Raspberry Pi 5 (camera + MQ-7 input path)

## 1) Start telemetry server

```powershell
cd learno-iot/server
npm install
npm run start:3001
```

Server runs on `http://localhost:3001`.

## 2) Configure ESP32 node 1 (`firmware/`)

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

## 3) Configure ESP32 node 2 (`esp2/`)

Edit `esp2/include/secrets.h` with your Wi-Fi and the same server host IP:

```cpp
constexpr char WIFI_SSID[] = "YourWiFiName";
constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
constexpr char API_HOST[] = "192.168.1.100";
```

Both ESP32 firmwares use:

- `API_PORT = 3001`
- `API_PATH = /api/telemetry`

## 4) Build and flash ESP32

### Node 1 (`firmware/`)

```powershell
cd learno-iot/firmware
python -m platformio run
python -m platformio run --target upload --upload-port COM3
python -m platformio device monitor --port COM3 --baud 115200
```

### Node 2 (`esp2/`)

```powershell
cd learno-iot/esp2
python -m platformio run
python -m platformio run --target upload --upload-port COM4
python -m platformio device monitor --port COM4 --baud 115200
```

List ports with:

```powershell
python -m platformio device list
```

## 5) Sensor pin mapping (ESP32)

- BH1750 SDA: GPIO21
- BH1750 SCL: GPIO22
- DHT22 data: GPIO4
- MQ-7 analog output: GPIO34

## 6) Raspberry Pi 5 node (optional)

Use the dedicated guide in `raspberry-pi5/README.md`.

## API endpoints

- `POST /api/telemetry`
- `GET /api/health`
- `GET /api/latest`
- `GET /api/history?limit=30`

## Operational notes

- ESP32/RPi5 and server must be on reachable network paths.
- Use the server machine LAN IP as `API_HOST` on devices.
- If you change the server port, update device port configuration accordingly.
