# Learno IoT - ESP32 Telemetry

This module contains the ESP32 firmware and telemetry server for classroom sensors.

## What is already configured

- Wi-Fi credentials in `firmware/include/secrets.h` (copy from `secrets.example.h`)
- API host points to the server on port `3000` (configurable in secrets.h)

## Prerequisites

### For Server (Node.js)
- **Node.js 20+**
- Install dependencies:
```powershell
cd learno-iot/server
npm install
```

### For Firmware (ESP32)
- **Python 3.10+**
- **PlatformIO**: `python -m pip install platformio`
- USB serial driver for your ESP32 board (CP210x or CH340)

### Hardware
- ESP32 DevKit board
- Optional sensors: BH1750 (light), DHT22 (temp/humidity), MQ-7 (gas)

## Firmware

### Build
```powershell
cd learno-iot/firmware
python -m platformio run
```

### Flash
```powershell
cd learno-iot/firmware
python -m platformio run --target upload --upload-port COM7
python -m platformio device monitor --port COM7
```
Replace `COM7` with your ESP32's actual COM port.

### Configure
Copy `firmware/include/secrets.example.h` to `firmware/include/secrets.h` and edit:
```cpp
constexpr char WIFI_SSID[] = "YourWiFiName";
constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
constexpr char API_HOST[] = "192.168.1.100";  // Your PC's IP
```

### Default ESP32 Pins
- I2C SDA: GPIO21
- I2C SCL: GPIO22
- DHT22: GPIO4
- MQ-7 analog: GPIO34

### Enable/Disable Sensors
Edit `firmware/include/device_config.h` to toggle sensors.

## Server

### Run
```powershell
cd learno-iot/server
npm start
```
Server runs on `http://localhost:3000`

### API Endpoints
- `POST /api/telemetry` - Receive sensor data
- `GET /api/latest` - Get latest reading
- `GET /api/history` - Get history (optional limit param)

## Testing

### Dry-run (without sensors)
1. Start server: `npm start`
2. Open `http://localhost:3000`
3. Use "Simulate" buttons to test the dashboard

### Real hardware
1. Flash firmware to ESP32
2. Wire sensors
3. Open serial monitor to see ESP32 status
4. Watch dashboard for live data

## Dependencies

### Server (package.json)
- cors
- dotenv
- express
- ws

### Firmware (platformio.ini)
- ArduinoJson
- BH1750
- Adafruit DHT sensor library
- Adafruit Unified Sensor
