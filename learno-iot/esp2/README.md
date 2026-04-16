# Learno ESP32 Node 2 (`esp2`)

This firmware is the second ESP32 telemetry node in the Learno IoT deployment. It continuously reads classroom environmental sensors and sends structured telemetry to the IoT server.

## Sensor outputs

- `lightLux` from BH1750
- `mq7Raw`, `mq7Voltage`, `mq7LevelPct` from MQ-7 analog line
- `co2Ppm` estimated from MQ-7 trend model

## Endpoint configuration

The firmware posts telemetry to:

- `http://API_HOST:3001/api/telemetry`

Configuration files:

- `include/secrets.h` for Wi-Fi and `API_HOST`
- `include/device_config.h` for `API_PORT`, `API_PATH`, pins, and sensor toggles

Edit `include/secrets.h`:

```cpp
constexpr char WIFI_SSID[] = "YourWiFiName";
constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
constexpr char API_HOST[] = "192.168.1.100";
```

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

## Monitor runtime

```powershell
cd learno-iot/esp2
python -m platformio device monitor --port COM4 --baud 115200
```

## Pin map

- BH1750 SDA: GPIO21
- BH1750 SCL: GPIO22
- DHT22 data: GPIO4
- MQ-7 analog output: GPIO34

## Sensor control flags

In `include/device_config.h`:

- `USE_BH1750`
- `USE_DHT22`
- `USE_MQ7_SENSOR`
