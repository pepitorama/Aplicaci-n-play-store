const SOUND_MAP = {
  place: [440, 0.05, "sine", 0.045],
  upgrade: [660, 0.08, "triangle", 0.05],
  hit: [220, 0.025, "square", 0.018],
  defeat: [820, 0.06, "sine", 0.04],
  leak: [120, 0.14, "sawtooth", 0.05],
  reward: [540, 0.11, "triangle", 0.05],
  unlock: [920, 0.14, "sine", 0.055],
  "wave-start": [330, 0.08, "triangle", 0.04],
  "wave-complete": [760, 0.16, "sine", 0.05],
  difficulty: [500, 0.06, "sine", 0.035]
};

export class SoundEngine {
  constructor({ muted = false } = {}) {
    this.muted = muted;
    this.context = null;
  }

  setMuted(muted) {
    this.muted = muted;
  }

  resume() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    if (!this.context) {
      this.context = new AudioContextClass();
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  play(type) {
    if (this.muted) {
      return;
    }

    this.resume();
    if (!this.context || !SOUND_MAP[type]) {
      return;
    }

    const [frequency, duration, waveType, gainValue] = SOUND_MAP[type];
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  playEvents(events) {
    const priority = ["unlock", "reward", "wave-complete", "leak", "defeat", "upgrade", "place", "wave-start", "difficulty"];
    const played = new Set();
    for (const eventType of priority) {
      if (events.some((event) => event.type === eventType) && !played.has(eventType)) {
        this.play(eventType);
        played.add(eventType);
      }
    }
  }
}
