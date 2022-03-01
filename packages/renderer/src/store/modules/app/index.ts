import { AppStateTypes } from './types'
import { getVidWithP, getVid, getBvid, judgeUserAgent } from '@/utils'
import { userAgent, videoUrlPrefix, liveUrlPrefix, bangumiUrlPrefix } from '@/utils/constant'
import { useHistoryStore } from '@/store'

const ipc = window.ipcRenderer

let lastPush = 0
let lastUrl: string

export const useAppStore = defineStore('app', {
  state: (): AppStateTypes => ({
    webview: null as unknown as Electron.WebviewTag,
    windowPosition: null,
    title: '',
    windowSize: {
      mobile: [376, 500],
      desktop: [1100, 600],
      mini: [300, 170],
      feed: [650, 760],
      login: [490, 394],
    },
    showAbout: false,
    disablePartButton: true,
    disableDanmakuButton: true,
    autoHideBar: false,
    windowID: {},
  }),
  actions: {
    loadSelfFromLocalStorage() {
      const storage = localStorage.getItem('app')
      if (!storage) return
      try {
        const map = new Map(JSON.parse(storage))
        map.forEach((value, key) => {
          // @ts-ignore
          this.$state[key] = value
        })
      } catch (e) {
        localStorage.removeItem('app')
      }
    },
    saveSelfToLocalStorage() {
      const map = new Map()
      const whiteList = ['windowPosition', 'windowSize']
      whiteList.forEach((value) => {
        // @ts-ignore
        map.set(value, this[value])
      })
      localStorage.setItem('app', JSON.stringify(Array.from(map.entries())))
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
      const vqq = /^\/x\/(m\/play\?cid=|cover\/)(\w+)(\.|&|\/)/.exec(_URL.pathname + _URL.search)
      if (vqq && vqq.length > 2) {
        if (vqq[1] === 'm/play?cid=') {
          historyStore.pop()
          this.webview.loadURL(`https://v.qq.com/x/cover/${vqq[2]}.html`, {
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

      this.webview.setUserAgent(judgeUserAgent(url))

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
        userAgent: judgeUserAgent(url),
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
