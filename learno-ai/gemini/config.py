# Gemini API configuration
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCjZIQ3eATFWhCJwTqlm-p4rZxBTU4LR2o")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACK_MODELS = [
	model.strip()
	for model in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-2.5-flash-lite,gemini-2.0-flash").split(",")
	if model.strip()
]
GEMINI_REQUEST_TIMEOUT_SEC = float(os.getenv("GEMINI_REQUEST_TIMEOUT_SEC", "90"))
GEMINI_CONNECT_TIMEOUT_SEC = float(os.getenv("GEMINI_CONNECT_TIMEOUT_SEC", "15"))
GEMINI_JSON_MAX_RETRIES = int(os.getenv("GEMINI_JSON_MAX_RETRIES", "2"))
GEMINI_MODELS_TO_TRY = [GEMINI_MODEL, *[m for m in GEMINI_FALLBACK_MODELS if m != GEMINI_MODEL]]


def build_gemini_url(model_name: str | None = None) -> str:
	"""Build the Gemini API URL for a specific model."""
	model = model_name or GEMINI_MODEL
	return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"


GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
