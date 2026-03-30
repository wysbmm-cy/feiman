// Type-safe access to window.electronAPI
// In web-only mode (development without Electron), this returns a mock

import type { ElectronAPI } from '../../../shared/ipc-types'

export function useElectron(): ElectronAPI | undefined {
  const api = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI
  return api
}
