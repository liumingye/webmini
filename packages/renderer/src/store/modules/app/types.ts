import type { AdapterInfo, LocalPluginInfo } from '~/interfaces/plugin'

export interface AppStateTypes {
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
  showTopBar: boolean
  currentWindowID: number
  windowID: { mainWindow?: number; selectPartWindow?: number }
  navigationState: {
    canGoBack: boolean
    canGoForward: boolean
  }
  localPlugins: LocalPluginInfo[]
  totalPlugins: AdapterInfo[]
}

export interface AppConfig extends AppStateTypes {
  windowPosition: number[]
}
