// Voice Recognition & 7-Second Silence Detection Module
const Voice = {
  isRecording: false,
  audioContext: null,
  analyser: null,
  mediaStream: null,
  recognition: null,
  silenceTimerInterval: null,
  lastSoundTime: null,
  silenceLimitMs: 7000, // Exact 7-second silence limit
  currentTranscript: '',
  mediaRecorder: null,
  audioChunks: [],

  init() {
    const micBtn = document.getElementById('voiceMicBtn');
    const cancelBtn = document.getElementById('voiceCancelBtn');
    const doneBtn = document.getElementById('voiceDoneBtn');

    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleVoice());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.stopVoice(false));
    }
    if (doneBtn) {
      doneBtn.addEventListener('click', () => this.stopVoice(true));
    }

    this.setupSpeechRecognition();
  },

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        const combined = (final + interim).trim();
        if (combined) {
          this.currentTranscript = combined;
          const previewEl = document.getElementById('voiceLivePreview');
          if (previewEl) {
            previewEl.textContent = this.currentTranscript;
          }
          // Reset silence timer on recognized speech
          this.lastSoundTime = Date.now();
        }
      };

      this.recognition.onerror = (err) => {
        console.warn('Web Speech recognition warning:', err.error);
      };
    } else {
      console.warn('Browser SpeechRecognition API not supported. Falling back to MediaRecorder + Whisper API.');
    }
  },

  async toggleVoice() {
    if (this.isRecording) {
      this.stopVoice(true);
    } else {
      await this.startVoice();
    }
  },

  async startVoice() {
    try {
      this.currentTranscript = '';
      const previewEl = document.getElementById('voiceLivePreview');
      if (previewEl) previewEl.textContent = 'Listening... Speak now.';
      
      const timerEl = document.getElementById('silenceTimer');
      if (timerEl) timerEl.textContent = '7.0s';

      // 1. Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Set up Web Audio Analyser for accurate 7-second silence detection
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      // 3. Set up MediaRecorder backup (for Whisper API fallback if needed)
      this.audioChunks = [];
      try {
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.start();
      } catch (mrErr) {
        console.warn('MediaRecorder error:', mrErr);
      }

      // 4. Start Speech Recognition
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Recognition already active or error:', e);
        }
      }

      // 5. Show overlay
      this.isRecording = true;
      document.getElementById('voiceOverlay').classList.remove('hidden');

      // 6. Start Silence Monitoring Loop
      this.lastSoundTime = Date.now();
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const SILENCE_THRESHOLD = 18; // Volume threshold (0-255)

      this.silenceTimerInterval = setInterval(() => {
        if (!this.isRecording) return;

        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const averageVolume = sum / dataArray.length;

        const now = Date.now();
        // If sound detected above threshold, reset silence timer
        if (averageVolume > SILENCE_THRESHOLD) {
          this.lastSoundTime = now;
        }

        const elapsedSilence = now - this.lastSoundTime;
        const remainingSeconds = Math.max(0, (this.silenceLimitMs - elapsedSilence) / 1000);

        if (timerEl) {
          timerEl.textContent = remainingSeconds.toFixed(1) + 's';
          if (remainingSeconds <= 3) {
            timerEl.style.color = '#f43f5e';
          } else {
            timerEl.style.color = '#38bdf8';
          }
        }

        // AUTO-STOP TRIGGER: If silent for 7 seconds!
        if (elapsedSilence >= this.silenceLimitMs) {
          console.log('Detected 7 seconds of continuous silence. Auto-stopping voice recording...');
          this.stopVoice(true);
        }
      }, 100);

    } catch (err) {
      console.warn('Microphone access notice:', err);
      // Show overlay with permission instruction rather than blocking alert
      document.getElementById('voiceOverlay').classList.remove('hidden');
      const statusText = document.getElementById('voiceStatusText');
      const previewEl = document.getElementById('voiceLivePreview');
      if (statusText) statusText.textContent = 'Microphone Access Required';
      if (previewEl) previewEl.innerHTML = '<span style="color: #fda4af;">⚠️ Microphone access was not granted. Please allow microphone permissions in your browser URL bar or settings, then try again.</span>';
      this.isRecording = false;
    }
  },

  async stopVoice(shouldSubmit = true) {
    if (!this.isRecording) return;
    this.isRecording = false;

    // Clear timers
    if (this.silenceTimerInterval) {
      clearInterval(this.silenceTimerInterval);
      this.silenceTimerInterval = null;
    }

    // Stop recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    // Stop audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
    }

    // Stop media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Hide overlay
    document.getElementById('voiceOverlay').classList.add('hidden');

    if (!shouldSubmit) {
      this.currentTranscript = '';
      return;
    }

    let finalSpeech = (this.currentTranscript || '').trim();

    // If speech recognition was empty but MediaRecorder captured audio, fallback to Whisper endpoint
    if (!finalSpeech && this.mediaRecorder && this.audioChunks.length > 0) {
      try {
        const statusText = document.getElementById('voiceStatusText');
        if (statusText) statusText.textContent = 'Transcribing via Whisper...';
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            finalSpeech = data.text.trim();
          }
        }
      } catch (wErr) {
        console.warn('Whisper fallback notice:', wErr);
      }
    }

    if (finalSpeech) {
      const textarea = document.getElementById('chatTextarea');
      if (textarea) {
        textarea.value = finalSpeech;
        textarea.dispatchEvent(new Event('input'));
        // Trigger send event with audio flag
        if (window.App && typeof window.App.sendMessage === 'function') {
          window.App.sendMessage(true);
        }
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Voice.init());
