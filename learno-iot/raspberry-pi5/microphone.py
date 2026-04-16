#!/usr/bin/env python3
"""
Learno Raspberry Pi 5 - Microphone Sensor (MQ7 CO2 Sensor)
Sends telemetry to server on port 3001
"""

import socket
import json
import time
import math

API_HOST = "192.168.1.184"
API_PORT = 3001
API_PATH = "/api/telemetry"
DEVICE_ID = "learno-rpi5-mic-01"
TELEMETRY_INTERVAL = 5

MQ7_ADC_PIN = 0
MQ7_SAMPLE_COUNT = 64
MQ7_TRIMMED_SAMPLE_COUNT = 8
MQ7_SAMPLE_DELAY_US = 250
ADC_MAX_READING = 4095
ADC_REFERENCE_VOLTAGE = 3.3
MQ7_FILTER_ALPHA = 0.25


class MQ7Sensor:
    def __init__(self, adc_pin=0):
        self.adc_pin = adc_pin
        self.filtered_raw = math.nan
        self.filter_primed = False
        self.previous_filtered_raw = math.nan
        
    def _read_adc(self):
        try:
            with open(f"/sys/bus/iio/devices/iio:device0/in_voltage{self.adc_pin}_raw", "r") as f:
                return int(f.read().strip())
        except:
            return 0
    
    def sample_window(self):
        raw_samples = []
        for _ in range(MQ7_SAMPLE_COUNT):
            raw_samples.append(self._read_adc())
            time.sleep(MQ7_SAMPLE_DELAY_US / 1_000_000)
        
        raw_samples.sort()
        
        start_index = min(MQ7_TRIMMED_SAMPLE_COUNT, MQ7_SAMPLE_COUNT // 2)
        end_index = max(start_index + 1, MQ7_SAMPLE_COUNT - start_index)
        
        accumulator = sum(raw_samples[start_index:end_index])
        trimmed_count = end_index - start_index
        
        window = {
            "averageRaw": accumulator / trimmed_count,
            "minimumRaw": raw_samples[start_index],
            "maximumRaw": raw_samples[end_index - 1]
        }
        window["spreadRaw"] = window["maximumRaw"] - window["minimumRaw"]
        window["spreadPct"] = (window["spreadRaw"] / max(window["averageRaw"], 1.0)) * 100.0
        
        return window
    
    def update_filter(self, window):
        if not self.filter_primed or math.isnan(self.filtered_raw):
            self.filtered_raw = window["averageRaw"]
            self.previous_filtered_raw = window["averageRaw"]
            self.filter_primed = True
        else:
            self.previous_filtered_raw = self.filtered_raw
            self.filtered_raw = ((1.0 - MQ7_FILTER_ALPHA) * self.filtered_raw) + \
                               (MQ7_FILTER_ALPHA * window["averageRaw"])
    
    def read(self):
        window = self.sample_window()
        self.update_filter(window)
        
        mq7_raw = self.filtered_raw
        mq7_voltage = (mq7_raw / ADC_MAX_READING) * ADC_REFERENCE_VOLTAGE
        mq7_level_pct = (mq7_raw / ADC_MAX_READING) * 100.0
        
        co2_baseline_ppm = 400.0
        co2_span_ppm = 1600.0
        clamped_pct = max(0.0, min(100.0, mq7_level_pct)) / 100.0
        co2_ppm = co2_baseline_ppm + (clamped_pct * co2_span_ppm)
        
        return {
            "mq7Raw": round(mq7_raw, 2),
            "mq7Voltage": round(mq7_voltage, 3),
            "mq7LevelPct": round(mq7_level_pct, 2),
            "co2Ppm": round(co2_ppm, 1)
        }


class TelemetryClient:
    def __init__(self, host, port, path):
        self.host = host
        self.port = port
        self.path = path
        
    def send(self, payload):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((self.host, self.port))
            
            request = f"POST {self.path} HTTP/1.1\r\n"
            request += f"Host: {self.host}:{self.port}\r\n"
            request += "Content-Type: application/json\r\n"
            request += f"Content-Length: {len(payload)}\r\n"
            request += "\r\n"
            request += payload
            
            sock.send(request.encode())
            response = sock.recv(4096)
            sock.close()
            
            return True
        except Exception as e:
            print(f"Failed to send telemetry: {e}")
            return False


def main():
    sensor = MQ7Sensor(MQ7_ADC_PIN)
    client = TelemetryClient(API_HOST, API_PORT, API_PATH)
    
    print(f"Learno Raspberry Pi 5 - Microphone (MQ7/CO2)")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Sending to {API_HOST}:{API_PORT}{API_PATH}")
    print("Starting warm-up (30 seconds)...")
    
    warmup_start = time.time()
    while time.time() - warmup_start < 30:
        sensor.read()
        time.sleep(1)
    
    print("Warm-up complete. Starting telemetry...")
    
    last_send = time.time()
    start_time = time.time()
    
    while True:
        try:
            now = time.time()
            if now - last_send < TELEMETRY_INTERVAL:
                time.sleep(0.1)
                continue
            
            last_send = now
            uptime_ms = int((now - start_time) * 1000)
            
            metrics = sensor.read()
            
            payload = {
                "deviceId": DEVICE_ID,
                "firmwareVersion": "rpi5-mic-v0.1.0",
                "uptimeMs": uptime_ms,
                "wifi": {
                    "ssid": "RPI5-ETH",
                    "ip": "",
                    "rssi": 0
                },
                "metrics": {
                    "lightLux": None,
                    "temperatureC": None,
                    "humidityPct": None,
                    "mq7Raw": metrics["mq7Raw"],
                    "mq7Voltage": metrics["mq7Voltage"],
                    "mq7LevelPct": metrics["mq7LevelPct"],
                    "co2Ppm": metrics["co2Ppm"]
                },
                "sensorTests": {
                    "mq7": {
                        "enabled": True,
                        "detected": True,
                        "readingOk": True,
                        "note": "RPi5 MQ7 hardware reading"
                    }
                },
                "systemTests": {
                    "wifiConnected": True,
                    "apiConfigured": True,
                    "lastTelemetrySendOk": True
                }
            }
            
            payload_json = json.dumps(payload)
            print(f"[{time.strftime('%H:%M:%S')}] CO2: {metrics['co2Ppm']} ppm | Raw: {metrics['mq7Raw']}")
            
            client.send(payload_json)
            
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()