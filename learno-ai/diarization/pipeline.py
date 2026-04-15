"""Pipeline loading for pyannote speaker diarization."""

import logging
import warnings

# We pass already-decoded waveforms to pyannote, so its optional torchcodec
# file-decoding warning is just noise on Windows when FFmpeg shared DLLs are
# not present.
warnings.filterwarnings(
    "ignore",
    message=r"\s*torchcodec is not installed correctly so built-in audio decoding will fail",
    category=UserWarning,
)
warnings.filterwarnings(
    "ignore",
    message=r"Redirecting import of pytorch_lightning\.callbacks\..* to lightning\.pytorch\.callbacks\..*",
)
warnings.filterwarnings(
    "ignore",
    message=r".*multiple `ModelCheckpoint` callback states in this checkpoint.*",
)
warnings.filterwarnings(
    "ignore",
    message=r"Lightning automatically upgraded your loaded checkpoint from .*",
)
warnings.filterwarnings(
    "ignore",
    message=r".*Found keys that are not in the model state dict but in the checkpoint: \['loss_func\.W'\].*",
)
warnings.filterwarnings(
    "ignore",
    message=r".*Model has been trained with a task-dependent loss function.*",
)
logging.getLogger("lightning.pytorch.utilities.migration.utils").setLevel(logging.WARNING)

from pyannote.audio import Pipeline, Model, Inference
from .config import HF_TOKEN

_pipeline = None
_embedding_model = None
_models_loaded = False


def load_pipeline():
    """Load and cache the diarization pipeline."""
    global _pipeline
    if _pipeline is None:
        print("🔄 Loading diarization pipeline... (may take 1-2 min first time)")
        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            token=HF_TOKEN
        )
        print("✅ Diarization pipeline loaded")
    return _pipeline


def load_embedding_model():
    """Load and cache the speaker embedding model."""
    global _embedding_model
    if _embedding_model is None:
        print("🔄 Loading speaker embedding model...")
        _embedding_model = Inference(
            Model.from_pretrained(
                "pyannote/embedding",
                token=HF_TOKEN,
                strict=False,
            ),
            window="whole"
        )
        print("✅ Embedding model loaded")
    return _embedding_model


def get_pipeline():
    """Get the cached pipeline (loads if not already loaded)."""
    return load_pipeline()


def get_embedding_model():
    """Get the cached embedding model (loads if not already loaded)."""
    return load_embedding_model()


def preload_all_models():
    """Preload all diarization models at startup for faster processing."""
    global _models_loaded
    if _models_loaded:
        return
    print("=" * 50)
    print("🚀 PRELOADING DIARIZATION MODELS...")
    print("=" * 50)
    load_pipeline()
    load_embedding_model()
    _models_loaded = True
    print("=" * 50)
    print("✅ DIARIZATION MODELS READY")
    print("=" * 50)


def are_models_loaded():
    """Check if all models are loaded."""
    return _pipeline is not None and _embedding_model is not None
