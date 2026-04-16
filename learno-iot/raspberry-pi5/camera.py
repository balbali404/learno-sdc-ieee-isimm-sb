#!/usr/bin/env python3
"""
Learno Raspberry Pi 5 - Camera Module
Ready for integration with telemetry server
Note: This code is ready but not active - integrate when needed
"""

import cv2
import numpy as np
import time
import json
import socket
import os

API_HOST = "192.168.1.184"
API_PORT = 3001
API_PATH = "/api/telemetry"
DEVICE_ID = "learno-rpi5-cam-01"

CAPTURE_WIDTH = 640
CAPTURE_HEIGHT = 480
CAPTURE_FPS = 30


class CameraSensor:
    def __init__(self, width=640, height=480):
        self.width = width
        self.height = height
        self.cap = None
        self.detected = False
        
    def initialize(self):
        try:
            self.cap = cv2.VideoCapture(0)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.cap.set(cv2.CAP_PROP_FPS, CAPTURE_FPS)
            
            if self.cap.isOpened():
                ret, frame = self.cap.read()
                self.detected = ret and frame is not None
                return self.detected
        except Exception as e:
            print(f"Camera init error: {e}")
        
        self.detected = False
        return False
    
    def capture_frame(self):
        if not self.cap or not self.cap.isOpened():
            return None
        
        ret, frame = self.cap.read()
        if ret and frame is not None:
            return frame
        return None
    
    def analyze_frame(self, frame):
        if frame is None:
            return None
        
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        h, w, _ = frame.shape
        
        avg_brightness = np.mean(hsv[:,:,2])
        
        green_mask = cv2.inRange(hsv, (35, 50, 50), (85, 255, 255))
        green_ratio = np.count_nonzero(green_mask) / (h * w)
        
        blue_mask = cv2.inRange(hsv, (90, 50, 50), (130, 255, 255))
        blue_ratio = np.count_nonzero(blue_mask) / (h * w)
        
        motion_threshold = 25
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (21, 21), 0)
        
        if hasattr(self, 'prev_frame') and self.prev_frame is not None:
            diff = cv2.absdiff(self.prev_frame, blur)
            motion_pixels = np.count_nonzero(diff > motion_threshold)
            motion_ratio = motion_pixels / (h * w)
        else:
            motion_ratio = 0
        
        self.prev_frame = blur
        
        return {
            "brightness": round(avg_brightness, 1),
            "greenRatio": round(green_ratio * 100, 2),
            "blueRatio": round(blue_ratio * 100, 2),
            "motionRatio": round(motion_ratio * 100, 2)
        }
    
    def release(self):
        if self.cap:
            self.cap.release()
            self.cap = None


def capture_photo(filename=None):
    camera = CameraSensor()
    
    if not camera.initialize():
        print("Camera not detected")
        return None
    
    frame = camera.capture_frame()
    camera.release()
    
    if frame is None:
        return None
    
    if filename:
        cv2.imwrite(filename, frame)
        print(f"Photo saved: {filename}")
    
    return frame


def stream_continuous():
    camera = CameraSensor()
    
    if not camera.initialize():
        print("Camera not detected")
        return
    
    print(f"Camera streaming at {camera.width}x{camera.height} @ {CAPTURE_FPS} FPS")
    print("Press 'q' to quit")
    
    prev_time = time.time()
    
    while True:
        frame = camera.capture_frame()
        
        if frame is None:
            continue
        
        analysis = camera.analyze_frame(frame)
        
        current_time = time.time()
        fps = 1 / (current_time - prev_time)
        prev_time = current_time
        
        cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        if analysis:
            cv2.putText(frame, f"Brightness: {analysis['brightness']}", (10, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
            cv2.putText(frame, f"Green: {analysis['greenRatio']}%", (10, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 1)
            cv2.putText(frame, f"Motion: {analysis['motionRatio']}%", (10, 130),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 1)
        
        cv2.imshow("Learno Camera", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    camera.release()
    cv2.destroyAllWindows()


def send_camera_telemetry(analysis_data):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((API_HOST, API_PORT))
        
        payload = {
            "deviceId": DEVICE_ID,
            "firmwareVersion": "rpi5-cam-v0.1.0",
            "uptimeMs": int(time.time() * 1000),
            "wifi": {
                "ssid": "RPI5-ETH",
                "ip": "",
                "rssi": 0
            },
            "metrics": {
                "lightLux": analysis_data.get("brightness"),
                "temperatureC": None,
                "humidityPct": None,
                "mq7Raw": None,
                "mq7Voltage": None,
                "mq7LevelPct": None,
                "co2Ppm": None
            },
            "sensorTests": {
                "camera": {
                    "enabled": True,
                    "detected": True,
                    "readingOk": True,
                    "note": f"Brightness={analysis_data.get('brightness')}, Motion={analysis_data.get('motionRatio')}%"
                }
            },
            "systemTests": {
                "wifiConnected": True,
                "apiConfigured": True,
                "lastTelemetrySendOk": True
            }
        }
        
        request = f"POST {API_PATH} HTTP/1.1\r\n"
        request += f"Host: {API_HOST}:{API_PORT}\r\n"
        request += "Content-Type: application/json\r\n"
        request += f"Content-Length: {len(json.dumps(payload))}\r\n"
        request += "\r\n"
        request += json.dumps(payload)
        
        sock.send(request.encode())
        sock.close()
        
        return True
    except Exception as e:
        print(f"Failed to send: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "stream":
            stream_continuous()
        elif sys.argv[1] == "capture":
            filename = sys.argv[2] if len(sys.argv) > 2 else "capture.jpg"
            capture_photo(filename)
    else:
        print("Usage:")
        print("  python camera.py stream        - Start continuous streaming")
        print("  python camera.py capture       - Capture single photo")
        print("  python camera.py capture <file> - Capture to specific file")