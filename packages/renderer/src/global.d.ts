import { FetchOptions } from '../../preload'

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: Electron.IpcRenderer
    removeLoading: () => void
    app: {
      getCookieValue: (name: string) => Promise<string>
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
      net: {
        fetch: <T>(
          url: string,
          options: Partial<FetchOptions> = {},
        ) => Promise<{
          ok: boolean
          status: number
          statusText: string
          headers: Record<string, string | string[]>
          text: () => Promise<string>
          json: () => Promise<T>
        }>
      }
    }
  }
}
