import { AppStateTypes, AppConfig } from './types'
import { loadURL } from '@/utils/view'
import { isURI } from '~/common/uri'

export const useAppStore = defineStore('app', {
  state: (): AppStateTypes => ({
    alwaysOnTop: 'on',
    title: 'webmini',
    windowSize: {
      mobile: [376, 500],
      desktop: [1100, 600],
      mini: [300, 170],
      feed: [650, 760],
      login: [490, 394],
    },
    disablePartButton: true,
    disableDanmakuButton: true,
    autoHideBar: false,
    showTopBar: true,
    currentWindowID: window.app.currentWindow.id,
    windowID: {},
    navigationState: {
      canGoBack: false,
      canGoForward: false,
    },
  }),
  actions: {
    init() {
      const storage = window.app.storage
      const config = storage.get()
      for (const key in config) {
        // @ts-ignore
        this.$state[key] = config[key]
      }
    },
    saveConfig<T extends keyof AppConfig>(newJson: Record<T, AppConfig[T]>) {
      const storage = window.app.storage
      storage.update(newJson)
    },
    updateURL(url: string, tabId: number) {
      window.app.logger.info(`updateURL - ${url} - tabId - ${tabId}`, { label: 'appStore' })
    },
    go(value: string) {
      let url = value
      if (isURI(url)) {
        url = value.indexOf('://') === -1 ? `http://${value}` : value
      }
      loadURL(url)
    },
  },
})
