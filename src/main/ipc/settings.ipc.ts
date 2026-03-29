import type { IpcMain } from 'electron'
import { IPC } from '../../shared/constants'
import type { IPCResponse } from '../../shared/ipc-types'
import { getSettings, setSettings } from '../services/settings.service'

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC.SETTINGS_GET, (): IPCResponse => {
    try {
      return { success: true, data: getSettings() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, partial): IPCResponse => {
    try {
      const updated = setSettings(partial)
      return { success: true, data: updated }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
