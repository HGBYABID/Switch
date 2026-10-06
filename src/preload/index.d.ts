import { ElectronAPI } from '@electron-toolkit/preload'

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

export interface MusicAPI {
  getSongs: (folderPath?: string) => Promise<SongItem[]>
  selectFolder: () => Promise<string | null>
  openInFolder: (filePath: string) => Promise<void>
  getDefaultFolder: () => Promise<string>
  getUserProfile: () => Promise<{ humanName: string; hollowName: string } | null>
  saveUserProfile: (profile: { humanName: string; hollowName: string }) => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: MusicAPI
  }
}

