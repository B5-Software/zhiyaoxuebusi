import type { Settings } from './types';
import { DEFAULT_SETTINGS } from './engine';

type Sound = 'click' | 'open' | 'success' | 'page' | 'bell' | 'step';

class GameAudio {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private settings: Settings = DEFAULT_SETTINGS;
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private hidden = false;

  configure(settings: Settings) {
    this.settings = settings;
    if (this.musicGain && this.context) this.musicGain.gain.setTargetAtTime(settings.music && !this.hidden ? settings.musicVolume / 100 * 0.19 : 0, this.context.currentTime, 0.2);
  }

  wake() {
    if (this.hidden) return;
    try {
      if (!this.context) {
        const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return;
        this.context = new Constructor();
        this.musicGain = this.context.createGain();
        this.musicGain.connect(this.context.destination);
        this.configure(this.settings);
        this.startMusic();
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined);
    } catch { /* Browsers without Web Audio still run the entire game. */ }
  }

  visibility(hidden: boolean) {
    this.hidden = hidden;
    this.configure(this.settings);
  }

  private note(frequency: number, when: number, duration: number, volume: number, output?: AudioNode, type: OscillatorType = 'sine') {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(volume, when + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.001, when + duration);
    oscillator.connect(envelope);
    envelope.connect(output ?? this.context.destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  play(sound: Sound) {
    this.wake();
    if (!this.context || !this.settings.sound || this.hidden) return;
    const now = this.context.currentTime;
    const volume = this.settings.effectsVolume / 100 * 0.14;
    const notes: Record<Sound, number[]> = {
      click: [660, 880], open: [392, 523, 659], success: [523, 659, 784, 1047],
      page: [350, 440], bell: [784, 659, 523, 659], step: [262, 330],
    };
    notes[sound].forEach((frequency, index) => this.note(frequency, now + index * (sound === 'click' ? 0.035 : 0.1), sound === 'click' ? 0.07 : 0.35, volume));
  }

  private startMusic() {
    if (this.timer) return;
    const melody = [523.25, 0, 659.25, 587.33, 0, 392, 440, 0, 523.25, 659.25, 783.99, 0, 659.25, 587.33, 523.25, 0, 440, 0, 523.25, 659.25, 587.33, 0, 392, 0, 440, 523.25, 0, 392, 349.23, 392, 523.25, 0];
    this.timer = setInterval(() => {
      if (!this.context || !this.musicGain || !this.settings.music || this.hidden || this.context.state !== 'running') return;
      const now = this.context.currentTime;
      const frequency = melody[this.beat % melody.length];
      if (frequency) {
        this.note(frequency, now, 1.35, 0.45, this.musicGain);
        this.note(frequency * 2, now, 0.75, 0.065, this.musicGain);
      }
      if (this.beat % 8 === 0) this.note([130.81, 174.61, 146.83, 196][Math.floor(this.beat / 8) % 4], now, 3.6, 0.25, this.musicGain);
      this.beat += 1;
    }, 620);
  }
}

export const audio = new GameAudio();