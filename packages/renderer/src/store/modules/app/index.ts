import { AppStateTypes, AppConfig } from './types'
import { useHistoryStore, usePluginStore } from '@/store'
import Site from '@/utils/site'

const last = reactive({
  push: 0,
  url: '',
})

export const useAppStore = defineStore('app', {
  state: (): AppStateTypes => ({
    webview: null as unknown as Electron.WebviewTag,
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
    saveConfig<T extends keyof AppConfig>(key: T, value: AppConfig[T]) {
      const storage = window.app.storage
      storage.get('config', (error, data: any) => {
        if (error) {
          window.app.logger.error(error)
          throw error
        }
        storage.set('config', { ...data, [key]: value }, (error: any) => {
          if (error) {
            window.app.logger.error(error)
            throw error
          }
        })
      })
    },
    loadPlugins(url: string) {
      const pluginStore = usePluginStore()
      pluginStore.unloadAllPlugins()
      pluginStore.loadAllPlugins(url)
    },
    updateURL(url: string) {
      if (last.url === url) return
      last.url = url
      window.app.logger.info(`updateURL - ${url}`, { label: 'appStore' })

      // 更新插件列表
      this.loadPlugins(url)

      // hook
      const pluginStore = usePluginStore()
      const updateUrlHooks = pluginStore.getHook('updateUrl')

      updateUrlHooks?.before({
        url: new URL(url),
      })

      const historyStore = useHistoryStore()

      // 历史push
      historyStore.push(url)

      // 通知webview加载脚本
      this.webview.send('load-commit')

      this.disablePartButton = true
      this.disableDanmakuButton = true
      this.autoHideBar = false

      this.webview.setUserAgent(new Site(url).getUserAgent())

      const now = Number(new Date())
      if (now - last.push < 500) {
        // 两次转跳间隔小于500ms，疑似redirect
        historyStore.pop()
      }
      last.push = now

      updateUrlHooks?.after({
        url: new URL(url),
      })

      // test
      // https://v.qq.com/x/cover/pld2wqk8kq044nv/r0035yfoa2m.html
      // https://m.v.qq.com/x/m/play?cid=u496ep9wpw4rkno&vid=
      // https://m.v.qq.com/cover/m/mzc00200jtxd9ap.html?vid=d0042iplesm
      // https://m.v.qq.com/x/play.html?cid=od1kjfd56e3s7n7
      // const cidArr = /(cid=|\/)([A-Za-z0-9]{15})/.exec(_URL.pathname + _URL.search)
      // // window.app.logger.debug(cidArr)
      // if (cidArr) {
      //   const vidArr = /(vid=|\/)([A-Za-z0-9]{11})(\.|$|&)/.exec(_URL.pathname + _URL.search)
      //   const cid = cidArr[2]
      //   const vid = vidArr ? vidArr[2] : ''
      //   if (_URL.hostname === 'm.v.qq.com') {
      //     historyStore.pop()
      //     const url = ref(`https://v.qq.com/x/cover/${cid}`)
      //     if (vid !== '') {
      //       url.value += `/${vid}`
      //     }
      //     url.value += `.html`
      //     this.webview.loadURL(url.value, {
      //       userAgent: userAgent.desktop,
      //     })
      //   }
      //   // if (cid + vid !== lastId) {
      //   getPartOfQQ(cid, vid)
      //   // lastId = cid + vid
      //   // console.log(lastId)
      //   // }
      //   this.disableDanmakuButton = true
      //   this.disablePartButton = true
      //   this.autoHideBar = true
      //   return
      // }
    },
    go(url: string) {
      if (this.webview.getURL() === url) return
      window.app.logger.debug(`go - ${url}`, { label: 'appStore' })
      // 更新插件列表
      this.loadPlugins(url)
      this.webview.src = url
      this.webview.loadURL(url, {
        userAgent: new Site(url).getUserAgent(),
      })
    },
  },
})
