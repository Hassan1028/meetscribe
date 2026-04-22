// speech.js — Speech Recognition Module
// Uses Web Speech API (webkitSpeechRecognition) for real-time mic transcription.
// Runs continuous recognition and accumulates a full transcript.

export class SpeechTranscriber {
  constructor() {
    this.recognition = null;
    this.isRunning = false;
    this.fullTranscript = ""; // accumulated final results
    this.interimTranscript = ""; // current partial result
    this.label = "[MIC]";

    // Callbacks
    this.onTranscriptUpdate = null; // (full, interim) => void
    this.onError = null; // (message) => void
    this.onNoSpeech = null; // () => void — fired on no-speech timeouts
    this.onEnd = null; // () => void — fired when recognition stops unexpectedly
  }

  /**
   * Check if Web Speech API is available in this browser.
   */
  static isSupported() {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }

  /**
   * Initialize and start continuous speech recognition.
   * @param {string} lang - BCP-47 language tag, e.g. "en-US"
   */
  start(lang = "en-US") {
    if (!SpeechTranscriber.isSupported()) {
      throw new Error("Web Speech API is not supported in this browser. Please use Chrome.");
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = lang;

    this.recognition.onstart = () => {
      this.isRunning = true;
      console.log("[MeetScribe] Speech recognition started.");
    };

    this.recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          // Append to full transcript with label
          this.fullTranscript += `${this.label} ${transcript.trim()} `;
          console.log("[MeetScribe] Final:", transcript.trim());
        } else {
          interim += transcript;
        }
      }
      this.interimTranscript = interim;

      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.fullTranscript, this.interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("[MeetScribe] Recognition error:", event.error);

      // "no-speech" is non-fatal — notify UI and continue
      if (event.error === "no-speech") {
        if (this.onNoSpeech) this.onNoSpeech();
        return;
      }

      const errorMessages = {
        "not-allowed": "Microphone permission denied.",
        "audio-capture": "No microphone detected.",
        "network": "Network error during speech recognition.",
        "aborted": "Recognition was aborted.",
        "service-not-allowed": "Speech recognition service not allowed.",
      };

      const msg = errorMessages[event.error] || `Recognition error: ${event.error}`;
      if (this.onError) this.onError(msg);
    };

    this.recognition.onend = () => {
      console.log("[MeetScribe] Recognition ended. Running?", this.isRunning);
      // Auto-restart if we didn't intentionally stop — debounced to avoid Chrome throttling
      if (this.isRunning) {
        console.log("[MeetScribe] Auto-restarting recognition...");
        setTimeout(() => {
          if (!this.isRunning) return;
          try {
            this.recognition.start();
          } catch (e) {
            console.warn("[MeetScribe] Could not restart recognition:", e.message);
          }
        }, 300);
      } else {
        if (this.onEnd) this.onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      throw new Error(`Could not start speech recognition: ${err.message}`);
    }
  }

  /**
   * Stop recognition. Does NOT auto-restart.
   * @returns {string} — The complete accumulated transcript
   */
  stop() {
    this.isRunning = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Safe to ignore
      }
    }
    // Append any remaining interim as final
    if (this.interimTranscript.trim()) {
      this.fullTranscript += `${this.label} ${this.interimTranscript.trim()} `;
    }
    this.interimTranscript = "";
    return this.fullTranscript.trim();
  }

  /**
   * Get current transcript (final + interim preview).
   */
  getTranscript() {
    return this.fullTranscript + (this.interimTranscript ? `... ${this.interimTranscript}` : "");
  }

  /**
   * Reset transcript for a new session.
   */
  reset() {
    this.fullTranscript = "";
    this.interimTranscript = "";
  }
}
