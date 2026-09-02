// Ambient Audio Synthesizer Engine for FocusTimer using Web Audio API

export type AmbientSoundType =
  | "none"
  | "rain"
  | "white_noise"
  | "pink_noise"
  | "brown_noise"
  | "forest_stream"
  | "waves"
  | "binaural_focus";

export interface AmbientSoundOption {
  id: AmbientSoundType;
  name: string;
  nameHi: string;
  description: string;
  icon: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  {
    id: "none",
    name: "Muted / Off",
    nameHi: "बंद (Muted)",
    description: "No background ambient sound",
    icon: "VolumeX",
  },
  {
    id: "rain",
    name: "Gentle Rain",
    nameHi: "हल्की बारिश",
    description: "Soothing rhythmic rainfall for calm reading",
    icon: "CloudRain",
  },
  {
    id: "white_noise",
    name: "White Noise",
    nameHi: "व्हाइट नॉइज़",
    description: "Masks background speech and distractions",
    icon: "Wind",
  },
  {
    id: "pink_noise",
    name: "Pink Noise",
    nameHi: "पिंक नॉइज़",
    description: "Balanced, warm frequencies for deep problem solving",
    icon: "Activity",
  },
  {
    id: "brown_noise",
    name: "Deep Brown Noise",
    nameHi: "ब्राउन नॉइज़ (गहरा)",
    description: "Deep low-pitch rumble for intense concentration",
    icon: "Radio",
  },
  {
    id: "forest_stream",
    name: "River Stream",
    nameHi: "नदी और हवा",
    description: "Flowing stream and natural mountain breeze",
    icon: "Droplets",
  },
  {
    id: "waves",
    name: "Ocean Surf",
    nameHi: "समुद्र की लहरें",
    description: "Slow rhythmic tidal swells for steady pacing",
    icon: "Waves",
  },
  {
    id: "binaural_focus",
    name: "Binaural Focus Beat",
    nameHi: "बाइनॉरल फोकस बीट",
    description: "Alpha/Gamma waves tuned for alertness and retention",
    icon: "Sparkles",
  },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = "none";
  private isPlaying: boolean = false;
  private volume: number = 0.5; // 0.0 to 1.0

  // Active Nodes
  private masterGain: GainNode | null = null;
  private sourceNodes: (AudioNode | number)[] = [];
  private intervalIds: number[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.35, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSound(): AmbientSoundType {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public stop() {
    this.cleanupNodes();
    this.isPlaying = false;
  }

  private cleanupNodes() {
    this.intervalIds.forEach((id) => window.clearInterval(id));
    this.intervalIds = [];

    this.sourceNodes.forEach((node) => {
      try {
        if (typeof node !== "number" && "stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        }
        if (typeof node !== "number" && "disconnect" in node) {
          node.disconnect();
        }
      } catch (e) {
        // ignore disconnect errors
      }
    });
    this.sourceNodes = [];

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain = null;
    }
  }

  public play(type: AmbientSoundType) {
    this.initContext();
    if (!this.ctx) return;

    this.stop();
    this.currentType = type;

    if (type === "none") {
      this.isPlaying = false;
      return;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    switch (type) {
      case "white_noise":
        this.createWhiteNoise();
        break;
      case "pink_noise":
        this.createPinkNoise();
        break;
      case "brown_noise":
        this.createBrownNoise();
        break;
      case "rain":
        this.createRainSound();
        break;
      case "forest_stream":
        this.createStreamSound();
        break;
      case "waves":
        this.createOceanWaves();
        break;
      case "binaural_focus":
        this.createBinauralBeats();
        break;
    }

    this.isPlaying = true;
  }

  // --- Noise Generators ---

  private createWhiteNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    // Highpass to eliminate harsh DC offset & gentle lowpass
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(8000, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);
    whiteNoise.start();
    this.sourceNodes.push(whiteNoise, filter);
  }

  private createPinkNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const pinkSource = this.ctx.createBufferSource();
    pinkSource.buffer = buffer;
    pinkSource.loop = true;
    pinkSource.connect(this.masterGain);
    pinkSource.start();
    this.sourceNodes.push(pinkSource);
  }

  private createBrownNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost
    }

    const brownSource = this.ctx.createBufferSource();
    brownSource.buffer = buffer;
    brownSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(600, this.ctx.currentTime);

    brownSource.connect(lowpass);
    lowpass.connect(this.masterGain);
    brownSource.start();
    this.sourceNodes.push(brownSource, lowpass);
  }

  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;
    // Rain bed: pink noise with bandpass filtering
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.05 * white) / 1.05;
      lastOut = data[i];
    }

    const rainBed = this.ctx.createBufferSource();
    rainBed.buffer = buffer;
    rainBed.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(1.2, this.ctx.currentTime);

    rainBed.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);
    rainBed.start();
    this.sourceNodes.push(rainBed, filter, rainGain);

    // Random soft droplets
    const interval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      try {
        const dropOsc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        const freq = 1800 + Math.random() * 1400;
        dropOsc.type = "sine";
        dropOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + 0.08);

        dropGain.gain.setValueAtTime(0.06 + Math.random() * 0.08, this.ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

        dropOsc.connect(dropGain);
        dropGain.connect(this.masterGain);
        dropOsc.start();
        dropOsc.stop(this.ctx.currentTime + 0.09);
      } catch (e) {}
    }, 180);

    this.intervalIds.push(interval);
  }

  private createStreamSound() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const streamSource = this.ctx.createBufferSource();
    streamSource.buffer = buffer;
    streamSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Modulate stream frequency gently
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.25, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
    lfo.connect(filter.frequency);
    lfo.start();

    streamSource.connect(filter);
    filter.connect(this.masterGain);
    streamSource.start();
    this.sourceNodes.push(streamSource, filter, lfo, lfoGain);
  }

  private createOceanWaves() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 2.5;
    }

    const waveSource = this.ctx.createBufferSource();
    waveSource.buffer = buffer;
    waveSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO for wave surges (every 7 seconds)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime); // ~7.1s period
    lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);
    lfo.connect(lowpass.frequency);
    lfo.start();

    waveSource.connect(lowpass);
    lowpass.connect(this.masterGain);
    waveSource.start();
    this.sourceNodes.push(waveSource, lowpass, lfo, lfoGain);
  }

  private createBinauralBeats() {
    if (!this.ctx || !this.masterGain) return;
    const baseFreq = 216; // Carrier frequency (Hz)
    const beatFreq = 14; // Beta wave focus difference (Hz)

    // Left channel carrier
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Right channel carrier
    const oscRight = this.ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.setValueAtTime(baseFreq + beatFreq, this.ctx.currentTime);

    const merger = this.ctx.createChannelMerger(2);

    const gainL = this.ctx.createGain();
    const gainR = this.ctx.createGain();
    gainL.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gainR.gain.setValueAtTime(0.4, this.ctx.currentTime);

    oscLeft.connect(gainL);
    oscRight.connect(gainR);

    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);

    merger.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();
    this.sourceNodes.push(oscLeft, oscRight, gainL, gainR, merger);
  }
}

export const ambientAudio = new AmbientAudioEngine();
