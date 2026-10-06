// Procedural dynamic artwork gradients and color palettes for music tracks

const GRADIENTS = [
  {
    bg: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
    glow: 'rgba(79, 70, 229, 0.4)',
    accent: '#818cf8'
  },
  {
    bg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    glow: 'rgba(236, 72, 153, 0.4)',
    accent: '#f472b6'
  },
  {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    glow: 'rgba(239, 68, 68, 0.4)',
    accent: '#fbbf24'
  },
  {
    bg: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
    glow: 'rgba(16, 185, 129, 0.4)',
    accent: '#34d399'
  },
  {
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    glow: 'rgba(139, 92, 246, 0.4)',
    accent: '#a78bfa'
  },
  {
    bg: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    glow: 'rgba(6, 182, 212, 0.4)',
    accent: '#38bdf8'
  },
  {
    bg: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    glow: 'rgba(244, 63, 94, 0.4)',
    accent: '#fb7185'
  },
  {
    bg: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
    glow: 'rgba(99, 102, 241, 0.4)',
    accent: '#c084fc'
  }
]

export function getTrackVisualTheme(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % GRADIENTS.length
  return GRADIENTS[index]
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const totalSeconds = Math.floor(seconds)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}
