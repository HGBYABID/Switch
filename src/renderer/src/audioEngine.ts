// Web Audio API Engine for Equalizer, Spatial Ambience, Bass Boost, Panning, and Visualizer

export interface EqualizerPreset {
  name: string
  label: string
  bands: [number, number, number, number, number] // [60Hz, 250Hz, 1kHz, 4kHz, 12kHz] in dB
}

export const EQ_PRESETS: EqualizerPreset[] = [
  { name: 'flat', label: 'Flat', bands: [0, 0, 0, 0, 0] },
  { name: 'bass', label: 'Bass Boost', bands: [6, 4, 1, 0, -1] },
  { name: 'vocal', label: 'Vocal Clarity', bands: [-2, 1, 5, 4, 2] },
  { name: 'lofi', label: 'Lo-Fi Warm', bands: [4, 2, -1, -4, -8] },
  { name: 'electronic', label: 'Electronic / EDM', bands: [7, 4, -1, 3, 6] },
  { name: 'acoustic', label: 'Acoustic / Chill', bands: [2, 2, 3, 2, 3] },
  { name: 'rock', label: 'Rock', bands: [5, 3, -2, 4, 5] },
  { name: 'treble', label: 'Treble Boost', bands: [-3, 0, 1, 5, 8] }
]

export const EQ_BAND_FREQUENCIES = [60, 250, 1000, 4000, 12000]
export const EQ_BAND_LABELS = ['60 Hz', '250 Hz', '1 kHz', '4 kHz', '12 kHz']

export class AudioEngine {
  private ctx: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private filterNodes: BiquadFilterNode[] = []
  private bassBoostNode: BiquadFilterNode | null = null
  private pannerNode: StereoPannerNode | null = null
  private spatialGain: GainNode | null = null
  private dryGain: GainNode | null = null
  private delayNode: DelayNode | null = null
  private feedbackGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private analyserNode: AnalyserNode | null = null

  private isInitialized = false

  public currentBands: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  public currentPreset = 'flat'
  public bassBoostDb = 0
  public pan = 0 // -1 to 1
  public spatialEnabled = false
  public spatialIntensity = 0.35

  init(audioElement: HTMLAudioElement) {
    if (this.isInitialized) return

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      this.ctx = ctx

      this.sourceNode = ctx.createMediaElementSource(audioElement)

      // 1. Equalizer 5-Band Filters
      // Band 0: 60Hz LowShelf
      const f0 = ctx.createBiquadFilter()
      f0.type = 'lowshelf'
      f0.frequency.value = 60
      f0.gain.value = this.currentBands[0]

      // Band 1: 250Hz Peaking
      const f1 = ctx.createBiquadFilter()
      f1.type = 'peaking'
      f1.frequency.value = 250
      f1.Q.value = 1.0
      f1.gain.value = this.currentBands[1]

      // Band 2: 1000Hz Peaking
      const f2 = ctx.createBiquadFilter()
      f2.type = 'peaking'
      f2.frequency.value = 1000
      f2.Q.value = 1.0
      f2.gain.value = this.currentBands[2]

      // Band 3: 4000Hz Peaking
      const f3 = ctx.createBiquadFilter()
      f3.type = 'peaking'
      f3.frequency.value = 4000
      f3.Q.value = 1.0
      f3.gain.value = this.currentBands[3]

      // Band 4: 12000Hz HighShelf
      const f4 = ctx.createBiquadFilter()
      f4.type = 'highshelf'
      f4.frequency.value = 12000
      f4.gain.value = this.currentBands[4]

      this.filterNodes = [f0, f1, f2, f3, f4]

      // 2. Extra Bass Boost LowShelf filter (90 Hz)
      this.bassBoostNode = ctx.createBiquadFilter()
      this.bassBoostNode.type = 'lowshelf'
      this.bassBoostNode.frequency.value = 90
      this.bassBoostNode.gain.value = this.bassBoostDb

      // 3. Stereo Panner
      if (ctx.createStereoPanner) {
        this.pannerNode = ctx.createStereoPanner()
        this.pannerNode.pan.value = this.pan
      }

      // 4. Spatial Ambience (Subtle Room Reverb Network)
      this.dryGain = ctx.createGain()
      this.dryGain.gain.value = 1.0

      this.spatialGain = ctx.createGain()
      this.spatialGain.gain.value = this.spatialEnabled ? this.spatialIntensity : 0

      this.delayNode = ctx.createDelay()
      this.delayNode.delayTime.value = 0.035 // 35ms room reflection

      this.feedbackGain = ctx.createGain()
      this.feedbackGain.gain.value = 0.25 // gentle decay

      // Delay loop
      this.delayNode.connect(this.feedbackGain)
      this.feedbackGain.connect(this.delayNode)
      this.delayNode.connect(this.spatialGain)

      // 5. Analyser Node for Visualizer
      this.analyserNode = ctx.createAnalyser()
      this.analyserNode.fftSize = 128
      this.analyserNode.smoothingTimeConstant = 0.82

      // 6. Master Gain
      this.masterGain = ctx.createGain()
      this.masterGain.gain.value = 1.0

      // Connect pipeline:
      // source -> f0 -> f1 -> f2 -> f3 -> f4 -> bassBoost -> panner (or direct)
      this.sourceNode.connect(f0)
      f0.connect(f1)
      f1.connect(f2)
      f2.connect(f3)
      f3.connect(f4)
      f4.connect(this.bassBoostNode)

      const preOutput = this.bassBoostNode

      // Connect through panner
      const afterPannerNode: AudioNode = this.pannerNode ? this.pannerNode : preOutput
      if (this.pannerNode) {
        preOutput.connect(this.pannerNode)
      }

      // Split into dry and spatial
      afterPannerNode.connect(this.dryGain)
      afterPannerNode.connect(this.delayNode)

      // Mix dry and spatial into master
      this.dryGain.connect(this.masterGain)
      this.spatialGain.connect(this.masterGain)

      // Master to Analyser to Destination
      this.masterGain.connect(this.analyserNode)
      this.analyserNode.connect(ctx.destination)

      this.isInitialized = true
    } catch (e) {
      console.warn('Failed to initialize Web Audio engine:', e)
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  setBandGain(bandIndex: number, gainDb: number) {
    if (bandIndex >= 0 && bandIndex < this.filterNodes.length) {
      this.currentBands[bandIndex] = gainDb
      const filter = this.filterNodes[bandIndex]
      if (filter && this.ctx) {
        filter.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05)
      }
      this.currentPreset = 'custom'
    }
  }

  setPreset(presetName: string) {
    const preset = EQ_PRESETS.find((p) => p.name === presetName)
    if (!preset) return

    this.currentPreset = preset.name
    this.currentBands = [...preset.bands]

    this.filterNodes.forEach((filter, i) => {
      if (filter && this.ctx) {
        filter.gain.setTargetAtTime(preset.bands[i], this.ctx.currentTime, 0.05)
      }
    })
  }

  resetEq() {
    this.setPreset('flat')
  }

  setBassBoost(gainDb: number) {
    this.bassBoostDb = gainDb
    if (this.bassBoostNode && this.ctx) {
      this.bassBoostNode.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05)
    }
  }

  setPan(val: number) {
    this.pan = Math.max(-1, Math.min(1, val))
    if (this.pannerNode && this.ctx) {
      this.pannerNode.pan.setTargetAtTime(this.pan, this.ctx.currentTime, 0.05)
    }
  }

  setSpatial(enabled: boolean, intensity = 0.35) {
    this.spatialEnabled = enabled
    this.spatialIntensity = intensity
    if (this.spatialGain && this.ctx) {
      const target = enabled ? intensity : 0
      this.spatialGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05)
    }
  }

  getFrequencyData(array: Uint8Array) {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>)
    }
  }

  getTimeDomainData(array: Uint8Array) {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>)
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode
  }
}

export const audioEngine = new AudioEngine()
