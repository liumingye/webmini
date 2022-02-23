export interface AppStateTypes {
  webview: Electron.WebviewTag
  windowPosition: number[] | null
  title: string
  windowSize: {
    mobile: number[]
    desktop: number[]
    mini: number[]
    feed: number[]
    login: number[]
  }
  showAbout: boolean
  disablePartButton: boolean
  disableDanmakuButton: boolean
  autoHideBar: boolean
  windowID: { mainWindow?: number; selectPartWindow?: number }
  lastPush: number
}
