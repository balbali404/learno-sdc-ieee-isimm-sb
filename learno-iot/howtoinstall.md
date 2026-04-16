# Learno IoT - How to Install

This guide covers how to set up and run the Learno IoT telemetry system on a new PC.

## Prerequisites

### For Server (Node.js)
- **Node.js 20+** - Download from https://nodejs.org

### For Firmware (ESP32)
- **Python 3.10+** - Download from https://www.python.org
- **PlatformIO** - Install via: `python -m pip install platformio`
- **USB Serial Driver** - CP210x or CH340 (depends on your ESP32 board)

### Hardware
- ESP32 DevKit board
- Optional sensors: BH1750 (light), DHT22 (temp/humidity), MQ-7 (gas)

---

## Step 1: Install Server Dependencies

```powershell
cd learno-iot/server
npm install
```

This installs:
- cors
- dotenv
- express
- ws

---

## Step 2: Configure Firmware

1. Copy the example secrets file:
   ```
   copy firmware/include/secrets.example.h firmware/include/secrets.h
   ```

2. Edit `firmware/include/secrets.h`:
   ```cpp
   constexpr char WIFI_SSID[] = "YourWiFiName";
   constexpr char WIFI_PASSWORD[] = "YourWiFiPassword";
   constexpr char API_HOST[] = "192.168.1.100";  // Your PC's IP address
   ```

---

## Step 3: Build Firmware

```powershell
cd learno-iot/firmware
python -m platformio run
```

---

## Step 4: Flash Firmware to ESP32

1. Find your ESP32's COM port (check Device Manager)
2. Run:
   ```powershell
   cd learno-iot/firmware
   python -m platformio run --target upload --upload-port COM7
   ```
   Replace `COM7` with your actual COM port.

3. To see serial output:
   ```powershell
   python -m platformio device monitor --port COM7
   ```

---

## Step 5: Run Server

```powershell
cd learno-iot/server
npm start
```

Server runs at: http://localhost:3000

---

## Default ESP32 Pins

| Sensor | Pin |
|--------|-----|
| I2C SDA | GPIO21 |
| I2C SCL | GPIO22 |
| DHT22 | GPIO4 |
| MQ-7 analog | GPIO34 |

---

## Enable/Disable Sensors

Edit `firmware/include/device_config.h` to toggle sensors on/off.

---

## API Endpoints

- `POST /api/telemetry` - Receive sensor data from ESP32
- `GET /api/latest` - Get latest reading
- `GET /api/history` - Get history (optional `?limit=100` param)

---

## Troubleshooting

### Server won't start
- Make sure Node.js 20+ is installed: `node --version`

### ESP32 not connecting
- Check Wi-Fi credentials in `secrets.h`
- Verify your PC's IP address is correct
- Check serial monitor for ESP32 errors

### Sensors not detected
- Verify wiring (see pin table above)
- Check sensor is enabled in `device_config.h`
- Use dashboard simulation buttons to test UI first

### Port already in use
- Change port in `.env` or run: `npm run start:3001`