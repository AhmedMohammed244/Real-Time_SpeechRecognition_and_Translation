import os

# Set Hugging Face model cache directory (optional)
os.environ["XDG_CACHE_HOME"] = "E:/WhisperCache"
from transformers import MarianMTModel, MarianTokenizer


# Supported MarianMT translation directions
# NOTE: Marian models are directional and only support specific language pairs
supported_marian_pairs = {
    ("en", "ar"),
    ("ar", "en"),
    ("en", "fr"),
    ("fr", "en"),
    ("en", "de"),
    ("de", "en"),
    ("en", "es"),
    ("es", "en"),
    ("en", "it"),
    ("it", "en"),
    # Add more supported pairs as needed
}

# Cache of loaded models
_model_cache = {}

# Load model and tokenizer for a given pair
def load_marian_model(src_lang, tgt_lang):
    key = (src_lang, tgt_lang)
    if key not in supported_marian_pairs:
        raise ValueError(f"Unsupported translation direction: {src_lang} -> {tgt_lang}")
    if key not in _model_cache:
        model_name = f"Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}"
        tokenizer = MarianTokenizer.from_pretrained(model_name)
        model = MarianMTModel.from_pretrained(model_name)
        _model_cache[key] = (tokenizer, model)
    return _model_cache[key]

# Translate text using MarianMT
def translate_text(text, src_lang_code, tgt_lang_code):
    tokenizer, model = load_marian_model(src_lang_code, tgt_lang_code)
    encoded = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    translated = model.generate(**encoded)
    return tokenizer.decode(translated[0], skip_special_tokens=True)
