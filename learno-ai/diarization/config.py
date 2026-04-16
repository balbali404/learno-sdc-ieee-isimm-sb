# Pyannote configuration
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN", "")

# Diarization settings
MIN_SILENCE_GAP = 3.0  # seconds
INTRO_DURATION = 60.0  # seconds for teacher calibration
