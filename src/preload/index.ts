import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getSongs: (folderPath?: string) => ipcRenderer.invoke('get-songs', folderPath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openInFolder: (filePath: string) => ipcRenderer.invoke('open-in-folder', filePath),
  getDefaultFolder: () => ipcRenderer.invoke('get-default-folder'),
  getUserProfile: () => ipcRenderer.invoke('get-user-profile'),
  saveUserProfile: (profile: { humanName: string; hollowName: string }) =>
    ipcRenderer.invoke('save-user-profile', profile)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
