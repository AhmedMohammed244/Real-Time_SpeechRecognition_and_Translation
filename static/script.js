let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let timeoutId;
const micIcon = document.getElementById("mic-icon");
const waveform = document.getElementById("waveform");
const ctx = waveform.getContext("2d");
waveform.width = waveform.offsetWidth;
waveform.height = waveform.offsetHeight;

function drawWave(dataArray) {
    ctx.clearRect(0, 0, waveform.width, waveform.height);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#4caf50";

    let sliceWidth = waveform.width / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
        let y = (dataArray[i] / 255.0) * waveform.height;
        ctx.lineTo(x, waveform.height - y);
        x += sliceWidth;
    }

    ctx.stroke();
}

async function startRecording() {
    micIcon.innerText = "🔴 Recording...";
    isRecording = true;
    audioChunks = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 512;

    let dataArray = new Uint8Array(analyser.frequencyBinCount);
    let silenceStart = null;
    const silenceThreshold = 10; // Lower is more sensitive to silence
    const maxSilence = 3000; // ms

    function updateWaveform() {
        if (!isRecording) return;

        analyser.getByteTimeDomainData(dataArray);
        drawWave(dataArray);

        // Calculate average volume level
        let avg = dataArray.reduce((sum, val) => sum + Math.abs(val - 128), 0) / dataArray.length;

        if (avg < silenceThreshold) {
            if (silenceStart === null) {
                silenceStart = Date.now();
            } else if (Date.now() - silenceStart > maxSilence) {
                stopRecording();
                return;
            }
        } else {
            silenceStart = null;
        }

        requestAnimationFrame(updateWaveform);
    }

    updateWaveform();

    mediaRecorder.ondataavailable = e => {
        audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("audio", blob);
        formData.append("source_lang", document.getElementById("source-lang").value);
        formData.append("target_lang", document.getElementById("target-lang").value);

        micIcon.innerText = "⏳ Processing...";

        fetch("/process", {
            method: "POST",
            body: formData
        }).then(res => res.json()).then(data => {
            document.getElementById("transcription").value = data.transcript;
            document.getElementById("translation").value = data.translation;
            micIcon.innerText = "🎤 Start Recording";
        });
    };

    mediaRecorder.start();
}


function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    micIcon.innerText = "⏳ Processing...";
    mediaRecorder.stop();

    mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("audio", blob);
        formData.append("source_lang", document.getElementById("source-lang").value);
        formData.append("target_lang", document.getElementById("target-lang").value);

        fetch("/process", {
            method: "POST",
            body: formData
        }).then(res => res.json()).then(data => {
            document.getElementById("transcription").value = data.transcript;
            document.getElementById("translation").value = data.translation;
            micIcon.innerText = "🎤 Start Recording";
        });
    };
}

micIcon.addEventListener("click", () => {
    if (!isRecording) {
        startRecording();
    }
});
