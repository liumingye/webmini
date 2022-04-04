import type { NetApi } from '~/interfaces'
import type Cookies from '~/common/cookies'
import type Versions from '~/preload/utils/versions'
import type { Logger } from 'winston'
import type { StorageService } from '~/main/services/storage'

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: Electron.IpcRenderer
    removeLoading: () => void
    app: {
      storage: StorageService
      cookies: Cookies
      versions: Versions
      screen: Electron.Screen
      currentWindow: Electron.BrowserWindow
      net: NetApi
      logger: Logger
    }
  }
}
