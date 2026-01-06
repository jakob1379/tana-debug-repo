// Exposed by preload
const { log, error } = window.electronAPI;

function appendLog(msg) {
    const logEl = document.getElementById('log');
    logEl.textContent += new Date().toISOString().slice(11, 23) + ' ' + msg + '\n';
    logEl.scrollTop = logEl.scrollHeight;
    log(msg);
}

function setStatus(msg) {
    document.getElementById('status').textContent = 'Status: ' + msg;
}

let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];

async function listAudioDevices() {
    try {
        appendLog('Requesting audio devices...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(d => d.kind === 'audioinput');
        appendLog(`Found ${audioDevices.length} audio input device(s):`);
        audioDevices.forEach(device => {
            appendLog(`  - ${device.label || 'Unlabeled'} (id: ${device.deviceId})`);
        });
        return audioDevices;
    } catch (err) {
        appendLog('Error enumerating devices: ' + err.message);
        error(err);
        return [];
    }
}

async function startRecording() {
    try {
        // Clear previous recording data and disable save button
        audioChunks = [];
        document.getElementById('saveBtn').disabled = true;
        
        appendLog('Requesting microphone access...');
        setStatus('Requesting microphone...');
        
        // Check permissions first
        if (typeof navigator.permissions !== 'undefined') {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            appendLog(`Microphone permission state: ${permission.state}`);
        }
        
        const constraints = {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                channelCount: 1,
                sampleRate: 44100
            },
            video: false
        };
        
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        appendLog('Microphone access granted!');
        appendLog(`Audio tracks: ${mediaStream.getAudioTracks().length}`);
        mediaStream.getAudioTracks().forEach(track => {
            appendLog(`  Track: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
            // Add event listeners to track
            track.onmute = () => appendLog(`Track ${track.label} muted`);
            track.onunmute = () => appendLog(`Track ${track.label} unmuted`);
            track.onended = () => appendLog(`Track ${track.label} ended`);
            track.addEventListener('mute', () => appendLog(`Track ${track.label} mute event`));
            track.addEventListener('unmute', () => appendLog(`Track ${track.label} unmute event`));
            track.addEventListener('ended', () => appendLog(`Track ${track.label} ended event`));
        });
        
        // Create MediaRecorder to capture audio data (optional)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
            ? 'audio/webm;codecs=opus' 
            : 'audio/webm';
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
        appendLog(`Using mime type: ${mimeType}`);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstart = () => {
            appendLog('MediaRecorder started');
        };
        mediaRecorder.onstop = () => {
            appendLog(`MediaRecorder stopped, captured ${audioChunks.length} chunks`);
            // Could create a blob and play back, but not necessary for debugging
        };
        mediaRecorder.onerror = (event) => {
            appendLog(`MediaRecorder error: ${event.error.name} - ${event.error.message}`);
        };
        
        mediaRecorder.start();
        setStatus('Recording...');
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        
        // Log audio context (optional)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        appendLog(`Audio context state: ${audioContext.state}`);
        const source = audioContext.createMediaStreamSource(mediaStream);
        appendLog('Created audio source from stream');
        
        // Add audio analyser to check if audio data is flowing
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);
        
        let audioLevelCheckCount = 0;
        const checkAudioLevel = () => {
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const value = (dataArray[i] - 128) / 128;
                sum += value * value;
            }
            const rms = Math.sqrt(sum / bufferLength);
            if (rms > 0.01) {
                appendLog(`Audio signal detected! RMS level: ${rms.toFixed(4)}`);
                audioLevelCheckCount++;
                if (audioLevelCheckCount === 1) {
                    appendLog('Microphone is capturing audio data.');
                }
            }
            if (audioLevelCheckCount < 10) {
                setTimeout(checkAudioLevel, 500);
            }
        };
        setTimeout(checkAudioLevel, 1000);
        
    } catch (err) {
        appendLog('Error accessing microphone: ' + err.message);
        appendLog('Full error: ' + JSON.stringify(err));
        error(err);
        setStatus('Error: ' + err.name);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        appendLog('Media stream tracks stopped');
        mediaStream = null;
    }
    setStatus('Stopped');
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    if (audioChunks.length > 0) {
        document.getElementById('saveBtn').disabled = false;
        appendLog(`Recording ready to save (${audioChunks.length} chunks)`);
    }
}

function saveRecording() {
    if (audioChunks.length === 0) {
        appendLog('No audio data to save');
        return;
    }
    
    try {
        appendLog('Creating audio blob...');
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${timestamp}.webm`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        appendLog(`Recording saved as ${filename} (${Math.round(blob.size / 1024)} KB)`);
        document.getElementById('saveBtn').disabled = true;
        setStatus('Recording saved');
    } catch (err) {
        appendLog('Error saving recording: ' + err.message);
        error(err);
    }
}

// UI event listeners
document.getElementById('startBtn').addEventListener('click', startRecording);
document.getElementById('stopBtn').addEventListener('click', stopRecording);
document.getElementById('saveBtn').addEventListener('click', saveRecording);
document.getElementById('listDevicesBtn').addEventListener('click', listAudioDevices);

// Initial log
appendLog('App started');
listAudioDevices();
