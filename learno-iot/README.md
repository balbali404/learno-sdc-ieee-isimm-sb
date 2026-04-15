# Learno ESP32 Pilot

This workspace contains a practical first version of the Learno classroom pilot:

- `firmware/`: ESP32 firmware built with PlatformIO and Arduino
- `server/`: local Node.js telemetry receiver with a live dashboard

The current baseline assumes:

- an `ESP32 DevKit`-style board
- Wi-Fi telemetry from the ESP32 to this PC
- optional classroom sensors connected to the ESP32

## What is already configured

- Wi-Fi credentials live in [firmware/include/secrets.h](c:\Users\pc\Desktop\Learno\firmware\include\secrets.h)
- API host currently points to this PC on port `3000`

If this PC's IP changes, update [firmware/include/secrets.h](c:\Users\pc\Desktop\Learno\firmware\include\secrets.h).

## Firmware

The firmware posts JSON telemetry to the local server every 5 seconds.

Supported baseline sensors:

- `BH1750` light sensor over I2C
- `DHT22` temperature/humidity sensor
- `MQ-7` analog gas sensor on an ADC pin

Only `MQ-7` is enabled by default right now. You can toggle sensors in [firmware/include/device_config.h](c:\Users\pc\Desktop\Learno\firmware\include\device_config.h).

### Default ESP32 pins

- `I2C SDA`: `GPIO21`
- `I2C SCL`: `GPIO22`
- `DHT22`: `GPIO4`
- `MQ-7 analog out`: `GPIO34`

### Build firmware

```powershell
cd c:\Users\pc\Desktop\Learno\firmware
python -m platformio run
```

### Flash firmware

Check the ESP32 COM port first, then run:

```powershell
cd c:\Users\pc\Desktop\Learno\firmware
python -m platformio run --target upload --upload-port COM7
python -m platformio device monitor --port COM7
```

Replace `COM7` with the real port on your PC.

## Server

The server accepts telemetry at `POST /api/telemetry`, keeps recent readings in memory, appends them to `server/data/telemetry.ndjson`, and shows a live dashboard.

The dashboard is also a sensor test bench. It now includes:

- live board and Wi-Fi status
- per-sensor pass/fail diagnostics
- raw JSON payload inspection
- simulation buttons for testing the UI before sensors are wired

### Install and run

```powershell
cd c:\Users\pc\Desktop\Learno\server
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Dry-run test flow

Before connecting real sensors, you can still validate the platform:

1. Start the server.
2. Open `http://localhost:3000`.
3. Click `Simulate healthy payload` to verify the success path.
4. Click `Simulate missing sensors` to verify failure states and diagnostics.
5. Click `Reset session` to clear saved test data.

## MQ-7 note

The current `MQ-7` support now includes a more realistic validation flow:

- short warm-up period after boot
- smoothed ADC reading instead of raw one-shot values
- stability checks across multiple telemetry cycles
- clearer notes for `warm-up`, `noisy signal`, `settling`, and `ready`

Wire it like this:

- `AO -> GPIO34`
- `GND -> GND`
- `VCC -> module power`
- `DO -> leave disconnected`

Important:

- the current workflow is for relative trend testing, not accurate `ppm`
- if your MQ-7 module is powered from `5V`, make sure `AO` does not exceed `3.3V` into the ESP32 ADC

## Real hardware test flow

Once the ESP32 appears on a COM port and the sensors are wired:

1. Flash the firmware.
2. Open the serial monitor.
3. Watch the dashboard change from `Waiting for board` to `Online`.
4. Check each sensor card:
   - `Pass`: enabled, detected, and reading valid
   - `Detected`: sensor is present but not yet producing a valid reading
   - `Fail`: sensor is enabled but not detected
   - `Disabled`: sensor support is turned off in config

## Notes

- `firmware/include/secrets.h` is local-only and ignored by git.
- If your ESP32 board is not a standard DevKit, update the board in [firmware/platformio.ini](c:\Users\pc\Desktop\Learno\firmware\platformio.ini).
- If your actual sensors are different, I can swap the drivers quickly now that the structure is in place.

## Full requirements (IoT + backend)

### Node / server side

- `Node.js 20+`
- Telemetry server (`learno-iot/server`): `npm install`
- Main backend (`learno-web/backend`): `npm install`

### ESP32 firmware side

- `Python 3.10+`
- `PlatformIO` (`python -m pip install platformio`)
- USB serial driver for your ESP32 board (CP210x or CH340 depending on board)

Libraries are already declared in `firmware/platformio.ini`:

- `ArduinoJson`
- `BH1750`
- `Adafruit DHT sensor library`
- `Adafruit Unified Sensor`

Create `firmware/include/secrets.h` from `firmware/include/secrets.example.h` and set Wi-Fi + API host.
