// Calming synthesized bells and chimes for study transitions

export function playStudyChime(type: 'focusComplete' | 'breakComplete' | 'tap' = 'focusComplete') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()

    if (type === 'tap') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
      return
    }

    // Peaceful Tibetan singing bowl / zen chime
    const baseFreq = type === 'focusComplete' ? 528 : 660 // 528 Hz = Solfeggio focus tone
    const partials = [1, 1.5, 2, 2.76]
    const gains = [0.25, 0.12, 0.08, 0.04]

    partials.forEach((mult, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq * mult, ctx.currentTime)

      gain.gain.setValueAtTime(gains[i], ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 2.2)
    })
  } catch {
    // Audio context unavailable
  }
}
