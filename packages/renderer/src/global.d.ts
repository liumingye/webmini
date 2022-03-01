import type Net from '../../preload/apis/net'
import type Cookies from '../../preload/apis/cookies'
import { Logger } from 'winston'

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: Electron.IpcRenderer
    removeLoading: () => void
    app: {
      cookies: Cookies
      versions: {
        App: string
        'Vue.js': string
        Electron: string
        Chromium: string
        'Node.js': string
        V8: string
        OS: string
      }
      screen: Electron.Screen
      preload: string
      cookie: string
      currentWindow: Electron.BrowserWindow
      net: Net
      logger: Logger
    }
  }
}
