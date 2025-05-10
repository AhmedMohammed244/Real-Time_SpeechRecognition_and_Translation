from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from speech import transcribe_audio
from translation import translate_text
import tempfile
import os

app = Flask(__name__, static_folder='static')
CORS(app)

# Serve index.html from static directory
@app.route('/')
def home():
    return send_from_directory('static', 'index.html')

# Serve other static files (JS, CSS, etc.)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# API endpoint to process uploaded audio
@app.route("/process", methods=["POST"])
def process_audio():
    file = request.files["audio"]
    src_lang = request.form["source_lang"]
    tgt_lang = request.form["target_lang"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
        f.write(file.read())
        f.flush()
        transcript = transcribe_audio(f.name, src_lang)
        translation = translate_text(transcript, src_lang, tgt_lang)

    os.remove(f.name)
    return jsonify({"transcript": transcript, "translation": translation})

if __name__ == "__main__":
    app.run(debug=True)
