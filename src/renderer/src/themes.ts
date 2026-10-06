import { ThemeConfig, ThemeId } from './types'

export const THEMES: Record<ThemeId, ThemeConfig> = {
  obsidian: {
    // Image 1 Style: Salesforce / Linear Deep Charcoal with Electric Lime #c6ff00
    id: 'obsidian',
    name: 'Electric Lime & Obsidian',
    category: 'dark',
    bgPrimary: '#080a0f',
    bgSurface: '#0e121a',
    bgCard: '#131824',
    bgCardContrast: '#ffffff',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textContrast: '#0b0f19',
    accent: '#c6ff00',
    accentMuted: 'rgba(198, 255, 0, 0.16)',
    accentGlow: 'rgba(198, 255, 0, 0.35)',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  amber: {
    // Image 2 Style: Workspace Velvet Black with Vivid Solar Tangerine #ff782d
    id: 'amber',
    name: 'Solar Amber & Midnight',
    category: 'dark',
    bgPrimary: '#070709',
    bgSurface: '#0f0f13',
    bgCard: '#16161c',
    bgCardContrast: '#ff782d',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textContrast: '#ffffff',
    accent: '#ff782d',
    accentMuted: 'rgba(255, 120, 45, 0.18)',
    accentGlow: 'rgba(255, 120, 45, 0.4)',
    border: 'rgba(255, 255, 255, 0.07)'
  },
  monochrome: {
    // Image 3 Style: iDraft Frosted Luxury Monochrome with Stark Noir/Porcelain
    id: 'monochrome',
    name: 'iDraft Frosted Noir',
    category: 'dark',
    bgPrimary: '#09090b',
    bgSurface: '#141417',
    bgCard: '#1c1c21',
    bgCardContrast: '#ffffff',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textContrast: '#09090b',
    accent: '#ffffff',
    accentMuted: 'rgba(255, 255, 255, 0.15)',
    accentGlow: 'rgba(255, 255, 255, 0.25)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  matcha: {
    id: 'matcha',
    name: 'Cyber Sage & Emerald',
    category: 'dark',
    bgPrimary: '#060d09',
    bgSurface: '#0c1712',
    bgCard: '#12221b',
    bgCardContrast: '#34d399',
    textPrimary: '#f0fdf4',
    textSecondary: '#86efac',
    textContrast: '#060d09',
    accent: '#10b981',
    accentMuted: 'rgba(16, 185, 129, 0.18)',
    accentGlow: 'rgba(16, 185, 129, 0.35)',
    border: 'rgba(16, 185, 129, 0.18)'
  },
  nord: {
    id: 'nord',
    name: 'Nordic Deep Slate',
    category: 'dark',
    bgPrimary: '#080d16',
    bgSurface: '#0f1726',
    bgCard: '#172236',
    bgCardContrast: '#38bdf8',
    textPrimary: '#f0f9ff',
    textSecondary: '#93c5fd',
    textContrast: '#080d16',
    accent: '#38bdf8',
    accentMuted: 'rgba(56, 189, 248, 0.18)',
    accentGlow: 'rgba(56, 189, 248, 0.35)',
    border: 'rgba(56, 189, 248, 0.16)'
  },
  academia: {
    id: 'academia',
    name: 'Dark Academia Bronze',
    category: 'dark',
    bgPrimary: '#0d0b09',
    bgSurface: '#161310',
    bgCard: '#211c18',
    bgCardContrast: '#d4a373',
    textPrimary: '#faf6f0',
    textSecondary: '#cbb69d',
    textContrast: '#0d0b09',
    accent: '#d4a373',
    accentMuted: 'rgba(212, 163, 115, 0.18)',
    accentGlow: 'rgba(212, 163, 115, 0.35)',
    border: 'rgba(212, 163, 115, 0.18)'
  }
}

export function applyTheme(themeId: ThemeId) {
  const theme = THEMES[themeId] || THEMES.obsidian
  const root = document.documentElement

  root.style.setProperty('--bg-dark', theme.bgPrimary)
  root.style.setProperty('--bg-surface', theme.bgSurface)
  root.style.setProperty('--bg-card', theme.bgCard)
  root.style.setProperty('--bg-card-contrast', theme.bgCardContrast)
  root.style.setProperty('--text-main', theme.textPrimary)
  root.style.setProperty('--text-muted', theme.textSecondary)
  root.style.setProperty('--text-contrast', theme.textContrast)
  root.style.setProperty('--accent-primary', theme.accent)
  root.style.setProperty('--accent-glow', theme.accentGlow)
  root.style.setProperty('--accent-muted', theme.accentMuted)
  root.style.setProperty('--border-subtle', theme.border)

  if (theme.category === 'light') {
    root.classList.add('light-theme')
    root.classList.remove('dark-theme')
  } else {
    root.classList.add('dark-theme')
    root.classList.remove('light-theme')
  }
}
