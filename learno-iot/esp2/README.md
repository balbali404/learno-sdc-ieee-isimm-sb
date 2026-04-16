# Learno ESP2

Second ESP32 device for telemetry.

## Configuration

Edit `include/secrets.h` with your WiFi and server settings:

```cpp
constexpr char WIFI_SSID[] = "YourWiFi";
constexpr char WIFI_PASSWORD[] = "YourPassword";
constexpr char API_HOST[] = "192.168.1.184";
```

## Build & Flash

```bash
cd esp2
python -m platformio run
python -m platformio run --target upload --upload-port COM3
```

## Sensors

- MQ7 (CO2) on GPIO34
- BH1750 (light) on I2C (GPIO21 SDA, GPIO22 SCL)
- DHT22 (disabled by default)