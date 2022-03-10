import { AppStateTypes, AppConfig } from './types'
import { loadURL } from '@/utils/view'
import { isURI } from '~/common/uri'

export const useAppStore = defineStore('app', {
  state: (): AppStateTypes => ({
    alwaysOnTop: 'on',
    title: 'bilimini',
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
      storage.get('config', (error, data) => {
        if (error) {
          // 读取出错删除配置文件
          storage.remove('config', function (error) {
            if (error) {
              window.app.logger.error(error)
              throw error
            }
          })
          window.app.logger.error(error)
          throw error
        }
        for (const key in data) {
          // @ts-ignore
          this.$state[key] = data[key]
        }
      })
    },
    saveConfig<T extends keyof AppConfig>(newJson: Record<T, AppConfig[T]>) {
      const storage = window.app.storage
      storage.get('config', (error, oldJson: any) => {
        if (error) {
          window.app.logger.error(error)
          throw error
        }
        storage.set('config', { ...oldJson, ...newJson }, (error: any) => {
          if (error) {
            window.app.logger.error(error)
            throw error
          }
        })
      })
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
