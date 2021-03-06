import { loadURL } from '@/utils/view'
import { isURI } from '~/common/uri'
import type { AdapterInfo, LocalPluginInfo } from '~/interfaces/plugin'
import { WindowTypeDefault } from '~/interfaces/view'
import { PluginStatus } from '~/interfaces/plugin'
import type { AppConfig, AppStateTypes } from './types'
import { fetchTotalPlugins } from '@/apis/plugin'
import { useRequest } from 'vue-request'
import { IconSettings, IconApps } from '@arco-design/web-vue/es/icon'

export const useAppStore = defineStore('app', {
  state: (): AppStateTypes => ({
    alwaysOnTop: 'on',
    title: 'webmini',
    windowSize: WindowTypeDefault,
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
    /**
     * 初始化
     */
    async init() {
      // console.log('init')
      const appDb = await window.ipcRenderer.invoke('db-get', 'appDb')
      if (appDb) {
        for (const key in appDb.data) {
          // @ts-ignore
          this.$state[key] = appDb.data[key]
        }
      } else {
        this.saveConfig('windowSize', toRaw(this.windowSize))
      }
    },
    /**
     * 保存配置
     * @param key 配置项
     * @param value 配置值
     */
    async saveConfig<T extends keyof AppConfig>(key: T, value: AppConfig[T]) {
      // const oldDb = await window.ipcRenderer.invoke('db-get', 'appDb')
      // const newDb = oldDb ? { ...oldDb.data, [key]: value } : { [key]: value }
      window.ipcRenderer.invoke('db-put', {
        _id: 'appDb',
        data: { [key]: value },
        // data: newDb,
      })
    },
    updateURL(url: string, tabId: number) {
      window.app.logger.info(`updateURL - ${url} - tabId - ${tabId}`, { label: 'appStore' })
    },
    go(value: string, plugin?: LocalPluginInfo) {
      let url = value
      if (isURI(url)) {
        url = value.indexOf('://') === -1 ? `http://${value}` : value
        loadURL(plugin, url)
      }
    },
    /**
     * 获取本地插件列表
     */
    getLocalPlugins(): void {
      window.ipcRenderer.invoke('get-local-plugins').then((localPlugins: LocalPluginInfo[]) => {
        localPlugins.push({
          name: 'Router',
          displayName: '插件市场',
          start: 'Plugin',
          icon: shallowRef(IconApps),
          version: '',
        })
        localPlugins.push({
          name: 'Router',
          displayName: '设置',
          start: 'Settings',
          icon: shallowRef(IconSettings),
          version: '',
        })
        this.localPlugins = localPlugins
      })
    },
    /**
     * 获取远程插件列表
     * @returns Promise<AdapterInfo[]>
     */
    getTotalPlugins(): Promise<AdapterInfo[]> {
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
                // 可升级
                if (info.version !== localPlugin.version) {
                  info.local.status = PluginStatus.UPGRADE
                }
                // 防止状态卡在ing中
                else if (info.local?.status === PluginStatus.UNINSTALLING) {
                  info.local.status = PluginStatus.INSTALLING_COMPLETE
                } else if (info.local?.status === PluginStatus.INSTALLING) {
                  info.local.status = undefined
                }
              }
              return info
            })
            resolve(this.totalPlugins)
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
