#pragma once

#include <Arduino.h>

constexpr char DEVICE_ID[] = "learno-esp32-01";
constexpr char FIRMWARE_VERSION[] = "0.1.0";

constexpr uint32_t SERIAL_BAUD_RATE = 115200;
constexpr uint32_t TELEMETRY_INTERVAL_MS = 5000;
constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS = 20000;
constexpr uint16_t API_PORT = 3001;
constexpr char API_PATH[] = "/api/telemetry";

constexpr bool USE_BH1750 = true;
constexpr bool USE_DHT22 = false;
constexpr bool USE_MQ7_SENSOR = true;

constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t DHT_PIN = 4;
constexpr uint8_t MQ7_ANALOG_PIN = 34;

constexpr uint8_t MQ7_SAMPLE_COUNT = 64;
constexpr uint8_t MQ7_TRIMMED_SAMPLE_COUNT = 8;
constexpr uint16_t MQ7_SAMPLE_DELAY_US = 250;
constexpr uint16_t ADC_MAX_READING = 4095;
constexpr float ADC_REFERENCE_VOLTAGE = 3.3f;
constexpr uint8_t MQ7_ADC_PRIME_READS = 8;
constexpr uint32_t MQ7_VALIDATION_WARMUP_MS = 30000;
constexpr uint8_t MQ7_REQUIRED_STABLE_CYCLES = 3;
constexpr float MQ7_FILTER_ALPHA = 0.25f;
constexpr float MQ7_MIN_DETECT_ADC = 5.0f;
constexpr float MQ7_SATURATION_MARGIN = 5.0f;
constexpr float MQ7_MAX_WINDOW_SPREAD_PCT = 45.0f;
constexpr float MQ7_MAX_WINDOW_SPREAD_ADC = 80.0f;
constexpr float MQ7_MAX_FILTER_DELTA_PCT = 35.0f;
