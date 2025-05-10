import os

# Set Whisper cache directory
os.environ["XDG_CACHE_HOME"] = "E:/WhisperCache"

import whisper



# Load Whisper model once
whisper_model = whisper.load_model("medium")

# Language mapping for Whisper (2-letter codes)
whisper_lang_map = {
    "ar": "ar",
    "en": "en",
    "fr": "fr",
    "de": "de",
}


# Function to transcribe audio using Whisper
def transcribe_audio(audio_path, lang_code="en"):
    whisper_lang = whisper_lang_map.get(lang_code, "en")
    result = whisper_model.transcribe(audio_path, language=whisper_lang)
    return result["text"]
