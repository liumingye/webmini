import { AppStateTypes, AppConfig } from './types'
import { getVidWithP, getVid, getBvid } from '@/utils'
import { userAgent, videoUrlPrefix, liveUrlPrefix, bangumiUrlPrefix } from '@/config/constant'
import { useHistoryStore } from '@/store'
import Site from '@/utils/site'

const ipc = window.ipcRenderer

let lastPush = 0
let lastUrl: string

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
    updateURL(url: string) {
      if (lastUrl === url) return
      lastUrl = url
      window.app.logger.info(`updateURL - ${url}`, { label: 'appStore' })

      this.addHistoryItem(url)

      // 通知webview加载脚本
      this.webview.send('load-commit')

      const _URL = new URL(url)
      const historyStore = useHistoryStore()
      // 视频
      const vid = getVidWithP(_URL.pathname)
      if (vid) {
        if (_URL.hostname === 'm.bilibili.com') {
          // historyStore.replace(videoUrlPrefix + vid)
          historyStore.pop()
          this.webview.loadURL(videoUrlPrefix + vid, {
            userAgent: userAgent.desktop,
          })
        }
        this.disableDanmakuButton = false
        this.autoHideBar = true
        if (this.windowID.selectPartWindow) {
          ipc.sendTo(this.windowID.selectPartWindow, 'url-changed', url)
        }
        return
      }

      // 番剧
      const bvid = getBvid(_URL.pathname)
      if (bvid) {
        if (_URL.hostname === 'm.bilibili.com') {
          // historyStore.replace(bangumiUrlPrefix + bvid)
          historyStore.pop()
          this.webview.loadURL(bangumiUrlPrefix + bvid, {
            userAgent: userAgent.desktop,
          })
        }
        this.disableDanmakuButton = false
        this.autoHideBar = true
        return
      }

      // test
      // https://v.qq.com/x/cover/pld2wqk8kq044nv/r0035yfoa2m.html
      // https://m.v.qq.com/x/m/play?cid=u496ep9wpw4rkno&vid=
      // https://m.v.qq.com/cover/m/mzc00200jtxd9ap.html?vid=d0042iplesm
      // https://m.v.qq.com/x/play.html?cid=od1kjfd56e3s7n7
      const vqq = /(id=|\/)([A-Za-z0-9]{15})(.*?)([A-Za-z0-9]{11}|)/g.exec(
        _URL.pathname + _URL.search,
      )
      // window.app.logger.debug(vqq)
      if (vqq && vqq.length >= 3) {
        if (_URL.hostname !== 'v.qq.com') {
          historyStore.pop()
          const id = ref(vqq[2])
          if (vqq[4] !== '') {
            id.value += `/${vqq[4]}`
          }
          this.webview.loadURL(`https://v.qq.com/x/cover/${id.value}.html`, {
            userAgent: userAgent.desktop,
          })
        }
        this.disableDanmakuButton = true
        this.disablePartButton = true
        this.autoHideBar = true
        return
      }

      this.disablePartButton = true

      // 直播
      if (_URL.hostname === 'live.bilibili.com') {
        const live = /^\/(h5\/||blanc\/)?(\d+).*/.exec(_URL.pathname)
        if (live) {
          if (live[1] === 'h5/') {
            // historyStore.replace(liveUrlPrefix + live[2])
            historyStore.pop()
            this.webview.loadURL(liveUrlPrefix + live[2], {
              userAgent: userAgent.desktop,
            })
          }
          this.disableDanmakuButton = false
          this.autoHideBar = true
          return
        }
      }

      this.disableDanmakuButton = true
      this.autoHideBar = false

      // 登录页
      if (url.indexOf('//passport.bilibili.com/login') >= 0) {
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        })
        return
      }

      this.webview.setUserAgent(new Site(url).getUserAgent())

      // 清除分p
      if (this.windowID.selectPartWindow) {
        ipc.sendTo(this.windowID.selectPartWindow, 'update-part', null)
      }
    },
    addHistoryItem(url: string) {
      const historyStore = useHistoryStore()
      // 历史push
      const now = Number(new Date())
      if (now - lastPush < 500) {
        // 两次转跳间隔小于500ms，疑似redirect
        historyStore.replace(url)
      } else {
        historyStore.push(url)
      }
      lastPush = now
    },
    go(url: string) {
      window.app.logger.debug(`go - ${url}`, { label: 'appStore' })
      if (this.webview.getURL() === url) return
      this.webview.loadURL(url, {
        userAgent: new Site(url).getUserAgent(),
      })
    },
    goPart(pid: number) {
      window.app.logger.debug(`goPart - ${pid}`, { label: 'appStore' })
      const vid = getVid(this.webview.getURL())
      if (vid) {
        const url = `${videoUrlPrefix}${vid}/?p=${pid}`
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        })
        console.log(`路由：选择分p，选中第${pid}，转跳地址：${url}`)
      }
    },
    goBangumiPart(ep: { bvid: number }) {
      window.app.logger.debug(`goBangumiPart - ${ep.bvid}`, { label: 'appStore' })
      this.webview.loadURL(videoUrlPrefix + ep.bvid, {
        userAgent: userAgent.desktop,
      })
    },
  },
})
