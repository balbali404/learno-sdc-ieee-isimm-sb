# Learno ESP32 Node 2 (`esp2`)

This firmware runs on the second ESP32 board (`learno-esp32-02`) and sends sensor telemetry to the Learno IoT server.

## Captured metrics

- `lightLux` from BH1750
- `mq7Raw`, `mq7Voltage`, `mq7LevelPct` from MQ-7 analog input
- `co2Ppm` estimated from MQ-7 trend model
- optional `temperatureC` and `humidityPct` from DHT22 (if enabled)

## Configuration

Edit `include/secrets.h`:

```cpp
constexpr char WIFI_SSID[] = "YourWiFiName";
constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
constexpr char API_HOST[] = "192.168.1.100";
```

`include/device_config.h` defines the endpoint:

- `API_PORT = 3001`
- `API_PATH = /api/telemetry`

## Build

```powershell
cd learno-iot/esp2
python -m platformio run
```

## Flash

```powershell
cd learno-iot/esp2
python -m platformio run --target upload --upload-port COM4
```

Replace `COM4` with your board port.

## Serial monitor

```powershell
cd learno-iot/esp2
python -m platformio device monitor --port COM4 --baud 115200
```

## Pin mapping

- BH1750 SDA: GPIO21
- BH1750 SCL: GPIO22
- DHT22 data: GPIO4
- MQ-7 analog output: GPIO34

## Sensor toggles

Edit `include/device_config.h`:

- `USE_BH1750`
- `USE_DHT22`
- `USE_MQ7_SENSOR`
