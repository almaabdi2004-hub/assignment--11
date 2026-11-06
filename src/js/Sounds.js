export class Sound {
  static audioContext = null;

  static getContext() {
    if (!this.audioContext) {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return null;

      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  static playTone(frequency, duration, delay = 0, volume = 0.12) {
    const context = this.getContext();

    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    const startTime = context.currentTime + delay;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      startTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  static correct() {
    this.playTone(523, 0.15);
    this.playTone(659, 0.15, 0.15);
    this.playTone(784, 0.25, 0.3);
  }

  static wrong() {
    this.playTone(300, 0.2);
    this.playTone(220, 0.3, 0.2);
  }

  static timeUp() {
    this.playTone(440, 0.2);
    this.playTone(350, 0.2, 0.25);
    this.playTone(250, 0.4, 0.5);
  }

  static complete() {
    this.playTone(523, 0.2);
    this.playTone(659, 0.2, 0.2);
    this.playTone(784, 0.2, 0.4);
    this.playTone(1046, 0.5, 0.6);
  }
}