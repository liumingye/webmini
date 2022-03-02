export interface AppStateTypes {
  webview: Electron.WebviewTag
  alwaysOnTop: 'on' | 'off' | 'playing'
  title: string
  windowSize: {
    mobile: number[]
    desktop: number[]
    mini: number[]
    feed: number[]
    login: number[]
  }
  disablePartButton: boolean
  disableDanmakuButton: boolean
  autoHideBar: boolean
  windowID: { mainWindow?: number; selectPartWindow?: number }
}

export interface AppConfig extends AppStateTypes {
  windowPosition: number[]
}
