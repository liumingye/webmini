import type Net from '~/common/net'
import type Cookies from '~/common/cookies'
import type Versions from '~/preload/utils/versions'
import { Logger } from 'winston'
import Storage from 'electron-json-storage'

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: Electron.IpcRenderer
    removeLoading: () => void
    app: {
      storage: typeof Storage
      cookies: Cookies
      versions: Versions
      screen: Electron.Screen
      // preload: string
      cookie: string
      currentWindow: Electron.BrowserWindow
      net: Net
      logger: Logger
    }
  }
}
