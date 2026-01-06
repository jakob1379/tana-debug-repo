# Electron Microphone Test MVP

A minimal Electron app to test `getUserMedia` microphone recording, created to debug Tana's microphone issues.

## Purpose

This app was created to isolate and test the microphone recording pipeline in Electron on a system where Tana was unable to record. The goal is to determine whether the issue lies in Electron's `getUserMedia` implementation, system permissions, or elsewhere in Tana's toolchain.

## Findings

✅ **SUCCESS: Microphone access works correctly on this system**

Test results show:
- `getUserMedia` successfully requests and obtains microphone access
- System permission state: `granted`
- Audio tracks are created with `readyState: live`
- Audio data is being captured (RMS levels detected: 0.17-0.45)
- Multiple audio input devices detected (3 devices including default, HD Audio Controller, and Easy Effects Source)

**Key observations:**
- The track initially showed `muted: true` but changed to `muted: false` when audio was detected
- Audio context state: `running`
- MediaRecorder successfully captures audio chunks
- No errors in the `getUserMedia` pipeline

## Implications for Tana Debugging

Since this minimal Electron app successfully accesses the microphone and captures audio data, the issue with Tana is likely **not** at the basic `getUserMedia`/Web Audio API level. Possible areas to investigate in Tana:

1. **Permission handling** - Tana may not be requesting permissions correctly
2. **Audio constraints** - Tana may be using different audio constraints that fail
3. **Audio processing pipeline** - Issues in Tana's audio processing after capture
4. **Electron version differences** - Tana may be using a different Electron version
5. **Packaging/bundling issues** - Native module dependencies or packaging problems
6. **Audio device selection** - Tana may be selecting a different audio device that fails

## How to Run the Test

### Prerequisites
- Nix (for development environment)
- Node.js (provided by Nix shell)

### Steps

1. Enter the Nix development shell:
   ```bash
   nix develop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the app:
   ```bash
   npm start
   ```

4. The app will open with DevTools showing console logs.

5. Click "Start Recording" to test microphone access.

## App Features

- Lists all available audio input devices
- Requests microphone access with basic audio constraints
- Uses MediaRecorder to capture audio data
- Uses AudioContext and AnalyserNode to detect audio signal levels
- Logs all events and states to console and UI
- Real-time audio level monitoring

## Technical Details

- **Electron**: 38.7.1 (via Nix package)
- **Node.js**: 24.12.0
- **Audio constraints**: 
  ```javascript
  {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
      sampleRate: 44100
    },
    video: false
  }
  ```

## Files

- `main.js` - Electron main process
- `preload.js` - Preload script with IPC bridge
- `renderer.js` - Renderer process with microphone logic
- `index.html` - UI
- `flake.nix` - Nix development shell with required dependencies

## Debugging Tips for Tana Team

1. Compare Tana's `getUserMedia` constraints with those in this app
2. Check if Tana is handling permission requests differently
3. Verify audio device selection logic
4. Test with different audio constraints (try disabling audio processing features)
5. Check for errors in MediaRecorder or AudioContext usage
6. Ensure all native dependencies are properly bundled

## Save Recording Feature

The app now includes a "Save Recording" button that allows saving captured audio as a `.webm` file (Opus codec). This is useful for:

- Verifying audio quality and content
- Testing that the recorded audio matches expectations
- Providing sample recordings for debugging

**How it works:**
1. Click "Start Recording" to begin capturing audio
2. Click "Stop Recording" when finished
3. Click "Save Recording" to download the audio file
4. Files are saved with timestamp format: `recording-YYYY-MM-DDThh-mm-ss-sss.webm`

The save feature uses the `MediaRecorder` API with `audio/webm;codecs=opus` mime type, which is widely supported in modern browsers and Electron.

## Conclusion

The microphone hardware and system permissions are functioning correctly. Tana's microphone issue likely resides in application-specific code, constraints, or audio processing pipeline rather than fundamental Electron/system compatibility problems.
