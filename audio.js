// audio.js — Audio Capture Module
// Handles: Mic via getUserMedia, Tab/System audio via getDisplayMedia
// Both streams are captured independently, transcribed separately,
// and merged into a unified transcript with [MIC] / [TAB] labels.

export class AudioCapture {
  constructor() {
    this.micStream = null;
    this.tabStream = null;
    this.audioContext = null;
    this.tabRecorder = null;
    this.tabAudioChunks = [];
    this.onStatusChange = null; // callback(message, type)
  }

  /**
   * Request microphone access.
   * @returns {MediaStream}
   */
  async captureMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
        video: false,
      });
      console.log("[MeetScribe] Mic stream acquired.");
      return this.micStream;
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Microphone permission denied. Please allow mic access and try again."
        : `Microphone error: ${err.message}`;
      throw new Error(msg);
    }
  }

  /**
   * Capture tab / browser audio using getDisplayMedia (Chrome's built-in share dialog).
   * Shows Chrome's native tab picker — user selects which tab to share audio from.
   * @returns {MediaStream} — audio-only stream
   */
  async captureTabWithDialog() {
    let displayStream;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 }, // required by Chrome to open the dialog; we discard video
        audio: true,
      });
    } catch (err) {
      if (err.name === "NotAllowedError") {
        throw new Error("Tab audio capture was cancelled.");
      }
      throw new Error(`Tab capture failed: ${err.message}`);
    }

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
      displayStream.getTracks().forEach(t => t.stop());
      throw new Error("No audio in selected tab. In Chrome's share dialog, make sure to tick 'Share tab audio'.");
    }

    // Isolate audio into its own stream, then stop the unneeded video track
    this.tabStream = new MediaStream(audioTracks);
    displayStream.getVideoTracks().forEach(t => t.stop());

    console.log("[MeetScribe] Tab audio captured via getDisplayMedia:", audioTracks[0].label);
    return this.tabStream;
  }

  /**
   * Start recording tab audio using MediaRecorder (for backup / future STT).
   * Tab audio is recorded as a blob; mic STT runs live via SpeechRecognition.
   */
  startTabRecorder(stream) {
    if (!stream) return;

    this.tabAudioChunks = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.tabRecorder = new MediaRecorder(stream, { mimeType });
    this.tabRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.tabAudioChunks.push(e.data);
      }
    };
    this.tabRecorder.start(1000); // collect chunks every 1s
    console.log("[MeetScribe] Tab MediaRecorder started.");
  }

  /**
   * Stop all streams and recorder.
   * @returns {Blob|null} — recorded tab audio blob
   */
  async stopAll() {
    let tabAudioBlob = null;

    // Stop tab recorder
    if (this.tabRecorder && this.tabRecorder.state !== "inactive") {
      tabAudioBlob = await new Promise((resolve) => {
        this.tabRecorder.onstop = () => {
          const blob = new Blob(this.tabAudioChunks, { type: "audio/webm" });
          resolve(blob);
        };
        this.tabRecorder.stop();
      });
    }

    // Stop mic tracks
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    // Stop tab tracks
    if (this.tabStream) {
      this.tabStream.getTracks().forEach((t) => t.stop());
      this.tabStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log("[MeetScribe] All streams stopped.");
    return tabAudioBlob;
  }
}
