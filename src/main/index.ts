import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { registerFilesystemHandlers } from './ipc/filesystem.ipc'
import { registerSettingsHandlers } from './ipc/settings.ipc'
import { registerWindowHandlers } from './ipc/window.ipc'
import { registerChatHistoryHandlers } from './ipc/chat-history.ipc'
import { registerRagHandlers } from './ipc/rag.ipc'
import { registerRagFilesHandlers } from './ipc/rag-files.ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    // Auto-open DevTools in dev mode for debugging
    if (is.dev) {
      mainWindow!.webContents.openDevTools({ mode: 'bottom' })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.feiman.app')

  // Clear default menu to prevent Electron from intercepting
  // keyboard shortcuts like Ctrl+M before they reach the renderer
  Menu.setApplicationMenu(null)

  registerFilesystemHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
  registerWindowHandlers(ipcMain, () => mainWindow)
  registerChatHistoryHandlers(ipcMain)
  registerRagHandlers(ipcMain)
  registerRagFilesHandlers(ipcMain)

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
