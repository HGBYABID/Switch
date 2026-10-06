export interface SongItem {
  id: string
  title: string
  artist: string
  filename: string
  path: string
  url: string
  size: number
  sizeFormatted: string
  extension: string
  mtime: number
}

export interface Subject {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface StudySession {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  durationMinutes: number
  mode: 'pomodoro' | 'stopwatch' | 'timer'
  timestamp: number
  treeType?: string
}

export interface PlantedTree {
  id: string
  species: 'sakura' | 'pine' | 'oak' | 'bonsai' | 'willow'
  subjectId: string
  subjectName: string
  subjectColor: string
  durationMinutes: number
  plantedAt: number
  growthStage: 1 | 2 | 3 | 4 // 1=seedling, 2=sprout, 3=young, 4=fully grown
}

export type ThemeId =
  | 'obsidian'
  | 'amber'
  | 'monochrome'
  | 'matcha'
  | 'nord'
  | 'academia'

export interface ThemeConfig {
  id: ThemeId
  name: string
  category: 'dark' | 'light'
  bgPrimary: string
  bgSurface: string
  bgCard: string
  bgCardContrast: string
  textPrimary: string
  textSecondary: string
  textContrast: string
  accent: string
  accentMuted: string
  accentGlow: string
  border: string
}

export type AppTab =
  | 'dashboard'
  | 'pomodoro'
  | 'stopwatch'
  | 'timer'
  | 'forest'
  | 'analytics'
  | 'music'
