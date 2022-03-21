import type Net from '~/common/net'
import type Cookies from '~/common/cookies'
import type Versions from '~/preload/utils/versions'
import type { Logger } from 'winston'
import type { StorageService } from '~/main/services/storage'
import type { Timer } from '~/common/timer'

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
      cookie: string
      currentWindow: Electron.BrowserWindow
      net: Net
      logger: Logger
    }
  }
}
