#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <math.h>
#include <stdlib.h>

#include <ArduinoJson.h>
#include <BH1750.h>
#include <DHT.h>

#include "device_config.h"
#include "secrets.h"

namespace {

struct SensorTest {
  bool enabled = false;
  bool detected = false;
  bool readingOk = false;
  String note = "Disabled";
};

struct SensorState {
  SensorTest light;
  SensorTest dht;
  SensorTest mq7;
};

struct SystemState {
  bool wifiConnected = false;
  bool apiConfigured = true;
  bool lastTelemetrySendOk = false;
};

struct SensorReadings {
  float lightLux = NAN;
  float temperatureC = NAN;
  float humidityPct = NAN;
  float mq7Raw = NAN;
  float mq7Voltage = NAN;
  float mq7LevelPct = NAN;
  float co2Ppm = NAN;
};

struct Mq7SampleWindow {
  float averageRaw = NAN;
  float minimumRaw = NAN;
  float maximumRaw = NAN;
  float spreadRaw = NAN;
  float spreadPct = NAN;
};

struct Mq7RuntimeState {
  bool filterPrimed = false;
  float filteredRaw = NAN;
  float previousFilteredRaw = NAN;
  float lastWindowSpreadPct = NAN;
  float lastFilterDeltaPct = NAN;
  uint8_t stableCycleCount = 0;
  unsigned long validationStartedAtMs = 0;
};

BH1750 g_lightSensor(0x23);
DHT g_dhtSensor(DHT_PIN, DHT22);
SensorState g_sensorState;
SystemState g_systemState;
Mq7RuntimeState g_mq7State;
unsigned long g_lastTelemetrySentAt = 0;
uint8_t g_lightSensorAddress = 0x23;

void logMessage(const String &message) {
  Serial.print("[Learno] ");
  Serial.println(message);
}

void onWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  if (event == ARDUINO_EVENT_WIFI_STA_CONNECTED) {
    logMessage("Associated with access point");
  }

  if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
    g_systemState.wifiConnected = true;
    logMessage("Got IP from access point");
    return;
  }

  if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    g_systemState.wifiConnected = false;
    logMessage("Wi-Fi disconnected, reason code: " +
               String(info.wifi_sta_disconnected.reason));
  }
}

void logVisibleNetworks() {
  logMessage("Scanning visible 2.4 GHz Wi-Fi networks...");
  const int networkCount = WiFi.scanNetworks(/*async=*/false, /*hidden=*/true);

  if (networkCount <= 0) {
    logMessage("No Wi-Fi networks found");
    return;
  }

  for (int index = 0; index < networkCount; ++index) {
    String line = String("Network ") + String(index + 1) + ": ";
    line += WiFi.SSID(index);
    line += " | RSSI " + String(WiFi.RSSI(index));
    line += " dBm | Channel " + String(WiFi.channel(index));
    line += " | Encryption " + String(static_cast<int>(WiFi.encryptionType(index)));
    logMessage(line);
  }

  WiFi.scanDelete();
}

bool isI2CDevicePresent(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

uint8_t findBh1750Address() {
  if (isI2CDevicePresent(0x23)) {
    return 0x23;
  }

  if (isI2CDevicePresent(0x5C)) {
    return 0x5C;
  }

  return 0;
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.setHostname(DEVICE_ID);

  if (WiFi.status() == WL_CONNECTED) {
    g_systemState.wifiConnected = true;
    return;
  }

  WiFi.disconnect(true, true);
  delay(750);

  logMessage("Connecting to Wi-Fi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED &&
         millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    g_systemState.wifiConnected = true;
    logMessage("Wi-Fi connected");
    logMessage("IP: " + WiFi.localIP().toString());
  } else {
    g_systemState.wifiConnected = false;
    logMessage("Wi-Fi connection timed out");
    logMessage("ESP32 supports 2.4 GHz Wi-Fi only");
    logVisibleNetworks();
  }
}

void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
}

float adcRawToVoltage(float raw) {
  return (raw / ADC_MAX_READING) * ADC_REFERENCE_VOLTAGE;
}

float adcRawToPct(float raw) {
  return constrain((raw / ADC_MAX_READING) * 100.0f, 0.0f, 100.0f);
}

float mq7LevelPctToCo2Ppm(float levelPct) {
  if (isnan(levelPct)) {
    return NAN;
  }

  constexpr float CO2_BASELINE_PPM = 400.0f;
  constexpr float CO2_SPAN_PPM = 1600.0f;
  const float clampedPct = constrain(levelPct, 0.0f, 100.0f) / 100.0f;
  return CO2_BASELINE_PPM + (clampedPct * CO2_SPAN_PPM);
}

Mq7SampleWindow sampleMq7Window() {
  Mq7SampleWindow window;
  uint16_t rawSamples[MQ7_SAMPLE_COUNT] = {};

  for (uint8_t sampleIndex = 0; sampleIndex < MQ7_SAMPLE_COUNT;
       ++sampleIndex) {
    rawSamples[sampleIndex] = static_cast<uint16_t>(analogRead(MQ7_ANALOG_PIN));
    delayMicroseconds(MQ7_SAMPLE_DELAY_US);
  }

  qsort(rawSamples, MQ7_SAMPLE_COUNT, sizeof(uint16_t),
        [](const void *left, const void *right) {
          const int lhs = *static_cast<const uint16_t *>(left);
          const int rhs = *static_cast<const uint16_t *>(right);
          return lhs - rhs;
        });

  const uint8_t startIndex = min<uint8_t>(MQ7_TRIMMED_SAMPLE_COUNT,
                                          MQ7_SAMPLE_COUNT / 2);
  const uint8_t endIndex = max<uint8_t>(startIndex + 1,
                                        MQ7_SAMPLE_COUNT - startIndex);

  double accumulator = 0.0;
  for (uint8_t sampleIndex = startIndex; sampleIndex < endIndex; ++sampleIndex) {
    accumulator += rawSamples[sampleIndex];
  }

  const uint8_t trimmedCount = endIndex - startIndex;
  const uint8_t q1Index = startIndex + (trimmedCount / 4);
  const uint8_t q3Index =
      min<uint8_t>(endIndex - 1, startIndex + ((trimmedCount * 3) / 4));

  window.averageRaw = static_cast<float>(accumulator / trimmedCount);
  window.minimumRaw = rawSamples[q1Index];
  window.maximumRaw = rawSamples[q3Index];
  window.spreadRaw = window.maximumRaw - window.minimumRaw;
  window.spreadPct =
      (window.spreadRaw / max(window.averageRaw, 1.0f)) * 100.0f;
  return window;
}

void updateMq7Filter(const Mq7SampleWindow &window) {
  if (!g_mq7State.filterPrimed || isnan(g_mq7State.filteredRaw)) {
    g_mq7State.filteredRaw = window.averageRaw;
    g_mq7State.previousFilteredRaw = window.averageRaw;
    g_mq7State.filterPrimed = true;
  } else {
    g_mq7State.previousFilteredRaw = g_mq7State.filteredRaw;
    g_mq7State.filteredRaw =
        ((1.0f - MQ7_FILTER_ALPHA) * g_mq7State.filteredRaw) +
        (MQ7_FILTER_ALPHA * window.averageRaw);
  }

  g_mq7State.lastWindowSpreadPct = window.spreadPct;

  if (g_mq7State.previousFilteredRaw <= 0.0f) {
    g_mq7State.lastFilterDeltaPct = 0.0f;
  } else {
    g_mq7State.lastFilterDeltaPct =
        (fabs(g_mq7State.filteredRaw - g_mq7State.previousFilteredRaw) /
         g_mq7State.previousFilteredRaw) *
        100.0f;
  }
}

void initializeSensors() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  delay(50);

  g_sensorState.light.enabled = USE_BH1750;
  g_sensorState.dht.enabled = USE_DHT22;
  g_sensorState.mq7.enabled = USE_MQ7_SENSOR;

  if (USE_BH1750) {
    g_lightSensorAddress = findBh1750Address();
    g_sensorState.light.detected = g_lightSensorAddress != 0;

    if (g_sensorState.light.detected) {
      g_sensorState.light.detected = g_lightSensor.begin(
          BH1750::CONTINUOUS_HIGH_RES_MODE, g_lightSensorAddress, &Wire);
    }

    g_sensorState.light.readingOk = false;

    if (g_sensorState.light.detected) {
      g_sensorState.light.note =
          "Detected on I2C address 0x" + String(g_lightSensorAddress, HEX) +
          ", waiting for reading";
      logMessage("BH1750: ready on address 0x" +
                 String(g_lightSensorAddress, HEX));
    } else {
      g_sensorState.light.note = "Not detected on I2C";
      logMessage("BH1750: not detected");
    }
  } else {
    g_sensorState.light.note = "Disabled in device_config.h";
  }

  if (USE_DHT22) {
    g_dhtSensor.begin();
    g_sensorState.dht.detected = false;
    g_sensorState.dht.readingOk = false;
    g_sensorState.dht.note = "Enabled, waiting for first valid reading";
    logMessage("DHT22: enabled");
  } else {
    g_sensorState.dht.note = "Disabled in device_config.h";
  }

  if (USE_MQ7_SENSOR) {
    pinMode(MQ7_ANALOG_PIN, INPUT);
    analogReadResolution(12);
    analogSetPinAttenuation(MQ7_ANALOG_PIN, ADC_11db);
    for (uint8_t readIndex = 0; readIndex < MQ7_ADC_PRIME_READS; ++readIndex) {
      analogRead(MQ7_ANALOG_PIN);
      delay(5);
    }

    g_mq7State = {};
    g_mq7State.validationStartedAtMs = millis();

    g_sensorState.mq7.detected = false;
    g_sensorState.mq7.readingOk = false;
    g_sensorState.mq7.note =
        "MQ-7 validation started. Warm-up and stability checks are in progress.";
    logMessage("MQ-7 analog sensor: enabled on GPIO" +
               String(MQ7_ANALOG_PIN));
  } else {
    g_sensorState.mq7.note = "Disabled in device_config.h";
  }
}

void scanI2CBus() {
  logMessage("I2C scan start...");
  uint8_t foundCount = 0;

  for (uint8_t address = 0x08; address <= 0x77; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      logMessage("I2C device found at 0x" + String(address, HEX));
      ++foundCount;
    }
  }

  if (foundCount == 0) {
    logMessage("I2C scan complete: no devices found");
  } else {
    logMessage("I2C scan complete: " + String(foundCount) + " device(s)");
  }
}

float readLightLux() {
  if (!g_sensorState.light.detected) {
    return NAN;
  }

  const float lux = g_lightSensor.readLightLevel();
  g_sensorState.light.readingOk = !isnan(lux) && lux >= 0;
  g_sensorState.light.note = g_sensorState.light.readingOk
                                 ? "Reading OK"
                                 : "Detected, but reading is invalid";
  return lux < 0 ? NAN : lux;
}

SensorReadings readSensors() {
  SensorReadings readings;
  readings.lightLux = readLightLux();

  if (g_sensorState.dht.enabled) {
    readings.temperatureC = g_dhtSensor.readTemperature();
    readings.humidityPct = g_dhtSensor.readHumidity();

    const bool hasValidTemperature = !isnan(readings.temperatureC);
    const bool hasValidHumidity = !isnan(readings.humidityPct);

    g_sensorState.dht.detected = hasValidTemperature || hasValidHumidity;
    g_sensorState.dht.readingOk = hasValidTemperature && hasValidHumidity;

    if (g_sensorState.dht.readingOk) {
      g_sensorState.dht.note = "Temperature and humidity readings are valid";
    } else {
      g_sensorState.dht.note =
          "No valid DHT22 reading yet. Check wiring and sensor power.";
    }
  }

  if (g_sensorState.mq7.enabled) {
    const Mq7SampleWindow window = sampleMq7Window();
    updateMq7Filter(window);

    readings.mq7Raw = g_mq7State.filteredRaw;
    readings.mq7Voltage = adcRawToVoltage(g_mq7State.filteredRaw);
    readings.mq7LevelPct = adcRawToPct(g_mq7State.filteredRaw);
    readings.co2Ppm = mq7LevelPctToCo2Ppm(readings.mq7LevelPct);

    const unsigned long validationElapsedMs =
        millis() - g_mq7State.validationStartedAtMs;
    const unsigned long warmupRemainingMs =
        validationElapsedMs >= MQ7_VALIDATION_WARMUP_MS
            ? 0
            : MQ7_VALIDATION_WARMUP_MS - validationElapsedMs;

    const bool signalNearZero = g_mq7State.filteredRaw <= MQ7_MIN_DETECT_ADC;
    const bool signalSaturated =
        window.averageRaw >= (ADC_MAX_READING - MQ7_SATURATION_MARGIN);
    const bool warmupComplete = warmupRemainingMs == 0;
    const bool stableWindow =
        !signalNearZero && !signalSaturated &&
        (window.spreadPct <= MQ7_MAX_WINDOW_SPREAD_PCT ||
         window.spreadRaw <= MQ7_MAX_WINDOW_SPREAD_ADC);
    const bool stableFilter =
        !g_mq7State.filterPrimed ||
        g_mq7State.lastFilterDeltaPct <= MQ7_MAX_FILTER_DELTA_PCT;

    g_sensorState.mq7.detected = !signalNearZero;

    if (signalNearZero) {
      g_mq7State.stableCycleCount = 0;
      g_sensorState.mq7.readingOk = false;
      g_sensorState.mq7.note =
          "ADC is near 0. Check MQ-7 AO, VCC, and GND wiring.";
    } else if (signalSaturated) {
      g_mq7State.stableCycleCount = 0;
      g_sensorState.mq7.readingOk = false;
      g_sensorState.mq7.note =
          "ADC is saturated near 3.3V. Do not feed more than 3.3V to GPIO34.";
    } else if (!warmupComplete) {
      g_mq7State.stableCycleCount = 0;
      g_sensorState.mq7.readingOk = false;
      g_sensorState.mq7.note =
          "Warm-up in progress: " +
          String((validationElapsedMs + 999) / 1000) + "/" +
          String((MQ7_VALIDATION_WARMUP_MS + 999) / 1000) +
          " s. Smoothed ADC " + String(g_mq7State.filteredRaw, 1) + ".";
    } else {
      const bool stableCycle = stableWindow && stableFilter;
      g_mq7State.stableCycleCount =
          stableCycle ? min<uint8_t>(g_mq7State.stableCycleCount + 1,
                                     MQ7_REQUIRED_STABLE_CYCLES)
                      : 0;

      if (!stableWindow) {
        g_sensorState.mq7.readingOk = false;
        g_sensorState.mq7.note =
            "Signal is noisy. Window spread is " +
            String(window.spreadPct, 1) + "% (" +
            String(window.spreadRaw, 1) +
            " ADC). Keep the sensor steady and let it warm longer.";
      } else if (!stableFilter) {
        g_sensorState.mq7.readingOk = false;
        g_sensorState.mq7.note =
            "Signal is settling. Cycle delta is " +
            String(g_mq7State.lastFilterDeltaPct, 1) +
            "%. Waiting for a steadier trend.";
      } else if (g_mq7State.stableCycleCount < MQ7_REQUIRED_STABLE_CYCLES) {
        g_sensorState.mq7.readingOk = false;
        g_sensorState.mq7.note =
            "Validation in progress: stable cycle " +
            String(g_mq7State.stableCycleCount) + "/" +
            String(MQ7_REQUIRED_STABLE_CYCLES) + ".";
      } else {
        g_sensorState.mq7.readingOk = true;
        g_sensorState.mq7.note =
            "Analog reading OK. Smoothed ADC " +
            String(g_mq7State.filteredRaw, 1) +
            ". Relative trend is ready; ppm still needs calibration.";
      }
    }
  }

  return readings;
}

void setOptionalMetric(JsonObject metrics, const char *key, float value) {
  if (isnan(value)) {
    metrics[key] = nullptr;
    return;
  }

  metrics[key] = value;
}

void setSensorTest(JsonObject parent, const char *key, const SensorTest &test) {
  JsonObject sensor = parent[key].to<JsonObject>();
  sensor["enabled"] = test.enabled;
  sensor["detected"] = test.detected;
  sensor["readingOk"] = test.readingOk;
  sensor["note"] = test.note;
}

String buildTelemetryPayload() {
  const SensorReadings readings = readSensors();

  JsonDocument document;
  document["deviceId"] = DEVICE_ID;
  document["firmwareVersion"] = FIRMWARE_VERSION;
  document["uptimeMs"] = millis();

  JsonObject wifi = document["wifi"].to<JsonObject>();
  wifi["ssid"] = WIFI_SSID;
  wifi["ip"] = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "";
  wifi["rssi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;

  JsonObject metrics = document["metrics"].to<JsonObject>();
  setOptionalMetric(metrics, "lightLux", readings.lightLux);
  setOptionalMetric(metrics, "temperatureC", readings.temperatureC);
  setOptionalMetric(metrics, "humidityPct", readings.humidityPct);
  setOptionalMetric(metrics, "mq7Raw", readings.mq7Raw);
  setOptionalMetric(metrics, "mq7Voltage", readings.mq7Voltage);
  setOptionalMetric(metrics, "mq7LevelPct", readings.mq7LevelPct);
  setOptionalMetric(metrics, "co2Ppm", readings.co2Ppm);

  JsonObject sensorTests = document["sensorTests"].to<JsonObject>();
  setSensorTest(sensorTests, "bh1750", g_sensorState.light);
  setSensorTest(sensorTests, "dht22", g_sensorState.dht);
  setSensorTest(sensorTests, "mq7", g_sensorState.mq7);

  JsonObject systemTests = document["systemTests"].to<JsonObject>();
  systemTests["wifiConnected"] = g_systemState.wifiConnected;
  systemTests["apiConfigured"] = g_systemState.apiConfigured;
  systemTests["lastTelemetrySendOk"] = g_systemState.lastTelemetrySendOk;

  String payload;
  serializeJson(document, payload);
  return payload;
}

bool sendTelemetry(const String &payload) {
  ensureWiFiConnected();
  if (WiFi.status() != WL_CONNECTED) {
    g_systemState.wifiConnected = false;
    g_systemState.lastTelemetrySendOk = false;
    logMessage("Skipping send because Wi-Fi is offline");
    return false;
  }

  HTTPClient http;
  const String url =
      String("http://") + API_HOST + ":" + String(API_PORT) + API_PATH;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  const int statusCode = http.POST(payload);

  if (statusCode > 0) {
    logMessage("Telemetry sent with status " + String(statusCode));
  } else {
    logMessage("Telemetry send failed: " + http.errorToString(statusCode));
  }

  g_systemState.lastTelemetrySendOk = statusCode >= 200 && statusCode < 300;
  http.end();
  return g_systemState.lastTelemetrySendOk;
}

}  // namespace

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);

  logMessage("Booting Learno ESP32 pilot firmware");
  WiFi.onEvent(onWiFiEvent);
  initializeSensors();
  scanI2CBus();
  connectToWiFi();
}

void loop() {
  const unsigned long now = millis();
  if (now - g_lastTelemetrySentAt < TELEMETRY_INTERVAL_MS) {
    delay(50);
    return;
  }

  g_lastTelemetrySentAt = now;
  const String payload = buildTelemetryPayload();

  Serial.println(payload);
  sendTelemetry(payload);
}
