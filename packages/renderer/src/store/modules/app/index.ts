import { loadURL } from '@/utils/view'
import { isURI } from '~/common/uri'
import type { AdapterInfo, LocalPluginInfo } from '~/interfaces/plugin'
import { PluginStatus } from '~/interfaces/plugin'
import type { AppConfig, AppStateTypes } from './types'
import { fetchTotalPlugins } from '@/apis/plugin'
import { useRequest } from 'vue-request'
import { IconSettings, IconApps } from '@arco-design/web-vue/es/icon'

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
    localPlugins: [],
    totalPlugins: [],
  }),
  actions: {
    init() {
      console.log('init')
      try {
        const storage = window.app.storage
        const config = storage.get()
        for (const key in config) {
          // @ts-ignore
          this.$state[key] = config[key]
        }
      } catch (error) {
        window.app.logger.error(error)
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
    getLocalPlugins() {
      window.ipcRenderer.invoke('get-local-plugins').then((localPlugins: LocalPluginInfo[]) => {
        localPlugins.push({
          name: 'Router',
          displayName: '插件市场',
          start: 'Plugin',
          icon: shallowRef(IconApps),
        })
        localPlugins.push({
          name: 'Router',
          displayName: '设置',
          start: 'Settings',
          icon: shallowRef(IconSettings),
        })
        this.localPlugins = localPlugins
      })
    },
    getTotalPlugins() {
      if (this.localPlugins.length === 0) {
        Promise.all([this.getLocalPlugins()])
      }
      return new Promise((resolve, reject) => {
        const { run } = useRequest(fetchTotalPlugins, {
          formatResult: (res) => {
            return res.data === undefined ? [] : res.data
          },
          onSuccess: (res: AdapterInfo[]) => {
            this.totalPlugins = res.map((info) => {
              const localPlugin = this.localPlugins.find((p) => p.name === info.name)
              if (!localPlugin) {
                // 本地不存在
                info.local = {} as LocalPluginInfo
                info.local.status = undefined
              } else {
                // 本地存在
                info.local = localPlugin
                // 防止状态卡在ing中
                if (info.local?.status === PluginStatus.UNINSTALLING) {
                  info.local.status = PluginStatus.INSTALLING_COMPLETE
                } else if (info.local?.status === PluginStatus.INSTALLING) {
                  info.local.status = undefined
                }
              }
              return info
            })
            resolve(this.localPlugins)
          },
          onError(error) {
            window.app.logger.error(error)
            reject(error)
          },
        })
        run()
      })
    },
  },
})
