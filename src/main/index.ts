import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
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
      nodeIntegration: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    // Auto-open DevTools in dev mode for debugging
    if (is.dev) {
      mainWindow!.webContents.openDevTools({ mode: 'bottom' })
    }
  })

  // Error handling for renderer process
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
    if (!is.dev) {
      dialog.showErrorBox('加载失败', `无法加载应用界面: ${errorDescription} (${errorCode})`)
    }
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
    if (!is.dev) {
      dialog.showErrorBox('渲染进程崩溃', `应用渲染进程意外退出: ${details.reason}`)
    }
  })

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const levels = ['verbose', 'info', 'warning', 'error']
    console.log(`[Renderer ${levels[level]}]:`, message)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    console.log('Loading file from:', indexPath)
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err)
      if (!is.dev) {
        dialog.showErrorBox('加载失败', `无法加载应用界面: ${err.message}`)
      }
    })
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
