import { AppStateTypes, AppConfig } from './types'
import { useHistoryStore, usePluginStore, useTabsStore } from '@/store'
import { callViewMethod, loadURL } from '@/utils/view'
import Site from '@/utils/site'
import { isURL } from '@/utils/url'
import { resizeMainWindow } from '@/utils'

const last = reactive({
  push: 0,
  domain: '',
})

export const useAppStore = defineStore('app', {
  state: (): AppStateTypes => ({
    // webview: null as unknown as Electron.WebviewTag,
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
    loadPlugins(url: string) {
      const _URL = new URL(url)

      if (last.domain === _URL.hostname) return
      last.domain = _URL.hostname

      const pluginStore = usePluginStore()
      pluginStore.unloadAllPlugins()
      pluginStore.loadAllPlugins(url)

      // 主题色更改
      const themeColorProvider = {
        light: {
          bg: '',
          text: '',
        },
        dark: {
          bg: '',
          text: '',
        },
      }
      const [themeColor]: Record<string, Record<string, string>>[] = pluginStore.registerAndGetData(
        'themeColor',
        themeColorProvider,
      )
      let scheme: 'dark' | 'light'
      const onDarkModeChange = ({ matches }: { matches: boolean }) => {
        if (matches) {
          scheme = 'dark'
        } else {
          scheme = 'light'
        }
        document.body.style.setProperty('--theme-color-bg', themeColor[scheme].bg)
        document.body.style.setProperty('--theme-color-text', themeColor[scheme].text)
        document.body.setAttribute('arco-theme', scheme)
      }
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', onDarkModeChange)
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onDarkModeChange)
      onDarkModeChange(window.matchMedia('(prefers-color-scheme: dark)'))
    },
    updateURL(url: string, tabId: number) {
      window.app.logger.info(`updateURL - ${url}`, { label: 'appStore' })

      // 更新插件列表
      this.loadPlugins(url)

      const _URL = new URL(url)

      // hook
      const pluginStore = usePluginStore()
      const updateUrlHooks = pluginStore.getHook('updateUrl')

      updateUrlHooks?.before({
        url: _URL,
      })

      const historyStore = useHistoryStore()

      // 历史push
      historyStore.push(url)

      // 通知webview加载脚本
      // this.webview.send('load-commit')

      this.disablePartButton = true
      this.disableDanmakuButton = true
      this.autoHideBar = false

      // const tabsStore = useTabsStore()
      callViewMethod(tabId, 'setUserAgent', new Site(url).userAgent)

      const now = Number(new Date())
      if (now - last.push < 500) {
        // 两次转跳间隔小于500ms，疑似redirect
        historyStore.pop()
      }
      last.push = now

      updateUrlHooks?.after({
        url: _URL,
      })

      resizeMainWindow()
    },
    go(value: string) {
      let url = value
      if (isURL(value)) {
        url = value.indexOf('://') === -1 ? `http://${value}` : value
      }
      const tabsStore = useTabsStore()
      const selectedTab = tabsStore.selectedTab()
      if (selectedTab) {
        if (selectedTab.url === url) return
        this.loadPlugins(url)
        loadURL(url, {
          userAgent: new Site(url).userAgent,
        })
      }
    },
  },
})
