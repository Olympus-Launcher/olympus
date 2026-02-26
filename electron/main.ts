import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import log from 'electron-log'
import Store from 'electron-store'
import { detectSteamGames, detectEpicGames, detectEAGames, GameInfo } from './gameDetector'

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
log.info('Application starting...')

const configDir = path.join(app.getPath('userData'), 'config')
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true })
}

const store = new Store({
  cwd: configDir,
  name: 'settings',
  defaults: {
    games: [],
    settings: {
      theme: 'dark',
      scanOnStartup: true
    }
  }
})

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  log.info('Creating main window...')
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    frame: false,
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    log.info('Window ready to show')
    mainWindow?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    log.info('Loading dev server URL:', VITE_DEV_SERVER_URL)
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    log.info('Loading production build')
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  log.info('App ready')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('get-games', async () => {
  log.info('IPC: get-games called')
  return store.get('games')
})

ipcMain.handle('save-games', async (_, games: GameInfo[]) => {
  log.info('IPC: save-games called, count:', games.length)
  store.set('games', games)
  return true
})

ipcMain.handle('scan-games', async () => {
  log.info('IPC: scan-games called')
  try {
    const existingGames = store.get('games') as GameInfo[]
    const existingIds = new Set(existingGames.map(g => g.id))
    
    const [steamGames, epicGames, eaGames] = await Promise.all([
      detectSteamGames(),
      detectEpicGames(),
      detectEAGames()
    ])

    const allDetectedGames = [...steamGames, ...epicGames, ...eaGames]
    const newGames = allDetectedGames.filter(g => !existingIds.has(g.id))

    const updatedGames = [...existingGames, ...newGames]
    store.set('games', updatedGames)

    log.info(`Scan complete. Found ${newGames.length} new games`)
    return { games: updatedGames, newCount: newGames.length }
  } catch (error) {
    log.error('Error scanning games:', error)
    throw error
  }
})

ipcMain.handle('add-game', async (_, game: Omit<GameInfo, 'id'>) => {
  log.info('IPC: add-game called', game.name)
  const games = store.get('games') as GameInfo[]
  const newGame: GameInfo = {
    ...game,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  games.push(newGame)
  store.set('games', games)
  return newGame
})

ipcMain.handle('remove-game', async (_, gameId: string) => {
  log.info('IPC: remove-game called', gameId)
  const games = store.get('games') as GameInfo[]
  const filtered = games.filter(g => g.id !== gameId)
  store.set('games', filtered)
  return true
})

ipcMain.handle('launch-game', async (_, game: GameInfo) => {
  log.info('IPC: launch-game called', game.name)
  try {
    await shell.openPath(game.executablePath)
    
    const games = store.get('games') as GameInfo[]
    const updated = games.map(g => {
      if (g.id === game.id) {
        return {
          ...g,
          lastPlayed: new Date().toISOString(),
          playCount: (g.playCount || 0) + 1
        }
      }
      return g
    })
    store.set('games', updated)
    
    log.info('Game launched successfully:', game.name)
    return true
  } catch (error) {
    log.error('Error launching game:', error)
    throw error
  }
})

ipcMain.handle('select-executable', async () => {
  log.info('IPC: select-executable called')
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('select-image', async () => {
  log.info('IPC: select-image called')
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('get-settings', async () => {
  return store.get('settings')
})

ipcMain.handle('save-settings', async (_, settings: { theme: string; scanOnStartup: boolean }) => {
  store.set('settings', settings)
  return true
})

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

log.info('Main process initialized')
