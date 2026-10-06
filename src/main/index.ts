import { app, shell, BrowserWindow, ipcMain, protocol, net, dialog } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import fs from 'fs'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Register privileged custom scheme for local media playback
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: true
    }
  }
])

const DEFAULT_SONGS_DIR = '/home/abid/Desktop/songs'
const SUPPORTED_EXTENSIONS = new Set([
  '.mp3',
  '.m4a',
  '.wav',
  '.ogg',
  '.flac',
  '.aac',
  '.opus',
  '.webm',
  '.wma'
])

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Clean and extract readable artist and title from filename
function cleanSongName(filename: string): { title: string; artist: string } {
  // Strip extension
  const ext = path.extname(filename)
  let raw = filename.slice(0, -ext.length).trim()

  // Remove common YouTube/download metadata junk
  raw = raw
    .replace(/^\[NA\]\s*/i, '')
    .replace(/\s*\(Official\s*(Music\s*)?(Video|Audio)\)/gi, '')
    .replace(/\s*\(Official\s*Audio\)/gi, '')
    .replace(/\s*\(Lyrics\)/gi, '')
    .replace(/\s*\[HD\]/gi, '')
    .replace(/\s*\[Amv\]/gi, '')
    .replace(/\s*\[\([^)]*\)\]/gi, '')
    .replace(/\s*-\s*[A-Za-z0-9_]+VEVO$/gi, '')
    .replace(/\s*-\s*Coke Studio Bangla$/gi, '')
    .replace(/\s*-\s*Laser Vision Music Station$/gi, '')
    .replace(/\s*-\s*Bagdhara Band$/gi, '')
    .trim()

  // Try to split on " - "
  if (raw.includes(' - ')) {
    const parts = raw.split(' - ')
    const artist = parts[0].trim()
    const title = parts.slice(1).join(' - ').trim()
    return { title: title || raw, artist: artist || 'Unknown Artist' }
  }

  return { title: raw, artist: 'Unknown Artist' }
}

function scanDirectoryForSongs(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      return []
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const songs: Array<{
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
    }> = []

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          const fullPath = path.join(dirPath, entry.name)
          let stat: fs.Stats | null = null
          try {
            stat = fs.statSync(fullPath)
          } catch {
            // Ignore unreadable file
          }

          const { title, artist } = cleanSongName(entry.name)
          const encodedPath = encodeURI(fullPath).replace(/#/g, '%23').replace(/\?/g, '%3F')

          songs.push({
            id: Buffer.from(fullPath).toString('base64'),
            title,
            artist,
            filename: entry.name,
            path: fullPath,
            url: `media://${encodedPath}`,
            size: stat ? stat.size : 0,
            sizeFormatted: stat ? formatFileSize(stat.size) : '0 MB',
            extension: ext.replace('.', '').toUpperCase(),
            mtime: stat ? stat.mtimeMs : 0
          })
        }
      }
    }

    // Sort songs alphabetically by title
    songs.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
    return songs
  } catch (err) {
    console.error('Failed to scan directory for songs:', err)
    return []
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1060,
    height: 720,
    minWidth: 780,
    minHeight: 540,
    show: false,
    autoHideMenuBar: true,
    title: 'Switch',
    backgroundColor: '#090b10',
    icon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.abid.switch')

  // Register protocol handler for media streaming with CORS headers
  protocol.handle('media', async (request) => {
    try {
      let rawPath = request.url.replace(/^media:\/\//i, '')
      if (!rawPath.startsWith('/')) {
        rawPath = '/' + rawPath
      }
      const decodedPath = decodeURIComponent(rawPath)
      if (!fs.existsSync(decodedPath)) {
        console.warn('Media file does not exist:', decodedPath)
        return new Response('File not found', { status: 404 })
      }
      const fileRes = await net.fetch(pathToFileURL(decodedPath).toString())
      const headers = new Headers(fileRes.headers)
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      headers.set('Access-Control-Allow-Headers', '*')
      headers.set('Accept-Ranges', 'bytes')

      return new Response(fileRes.body, {
        status: fileRes.status,
        statusText: fileRes.statusText,
        headers
      })
    } catch (err) {
      console.error('Error handling media protocol:', err)
      return new Response('Error loading media', { status: 500 })
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Setup IPC Handlers
  ipcMain.handle('get-songs', (_, folderPath?: string) => {
    const targetFolder = folderPath && folderPath.trim() !== '' ? folderPath : DEFAULT_SONGS_DIR
    return scanDirectoryForSongs(targetFolder)
  })

  ipcMain.handle('get-default-folder', () => {
    return DEFAULT_SONGS_DIR
  })

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Music Folder',
      defaultPath: DEFAULT_SONGS_DIR,
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('open-in-folder', (_, filePath: string) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath)
    }
  })

  const USER_PROFILE_FILE = path.join(app.getPath('userData'), 'user_profile.json')

  ipcMain.handle('get-user-profile', () => {
    try {
      if (fs.existsSync(USER_PROFILE_FILE)) {
        const raw = fs.readFileSync(USER_PROFILE_FILE, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err)
    }
    return null
  })

  ipcMain.handle('save-user-profile', (_, profile: { humanName: string; hollowName: string }) => {
    try {
      fs.mkdirSync(app.getPath('userData'), { recursive: true })
      fs.writeFileSync(USER_PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8')
      return true
    } catch (err) {
      console.error('Failed to save user profile:', err)
      return false
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

