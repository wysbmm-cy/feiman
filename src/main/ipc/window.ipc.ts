import type { IpcMain, BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants'

export function registerWindowHandlers(ipcMain: IpcMain, getWindow: () => BrowserWindow | null): void {
  ipcMain.on(IPC.WINDOW_MINIMIZE, () => getWindow()?.minimize())
  ipcMain.on(IPC.WINDOW_MAXIMIZE, () => {
    const win = getWindow()
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.on(IPC.WINDOW_CLOSE, () => getWindow()?.close())
}
