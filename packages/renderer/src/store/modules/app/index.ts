import { AppStateTypes } from './types'
import { defineStore } from 'pinia'
import { getVidWithP, getVid, getBvid, judgeUserAgent } from '@/utils'
import { userAgent, videoUrlPrefix, liveUrlPrefix, bangumiUrlPrefix } from '@/utils/constant'
import { useHistoryStore } from '@/store'

const ipc = window.ipcRenderer

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
    lastPush: 0,
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
    updateURL() {
      const historyStore = useHistoryStore()

      const url = this.webview.getURL()
      console.log('updateURL', url)

      // 历史push
      const now = Number(new Date())
      if (now - this.lastPush < 500) {
        // 两次转跳间隔小于500ms，疑似redirect
        historyStore.replace(url)
      } else {
        historyStore.push(url)
      }
      this.lastPush = now

      // 通知webview加载脚本
      this.webview.send('load-commit')

      // 视频
      const vid = getVidWithP(url)
      if (vid) {
        if (url.indexOf('//m.bilibili.com') > -1) {
          historyStore.replace(videoUrlPrefix + vid)
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
      const bvid = getBvid(url)
      if (bvid) {
        if (url.indexOf('//m.bilibili.com') > -1) {
          historyStore.replace(bangumiUrlPrefix + bvid)
          this.webview.loadURL(bangumiUrlPrefix + bvid, {
            userAgent: userAgent.desktop,
          })
        }
        this.disableDanmakuButton = false
        this.autoHideBar = true
        return
      }

      this.disablePartButton = true

      // 直播
      const live = /live\.bilibili\.com\/(h5\/||blanc\/)?(\d+).*/.exec(url)
      if (live) {
        if (url.indexOf('//live.bilibili.com/h5/') > -1) {
          historyStore.replace(liveUrlPrefix + live[2])
          this.webview.loadURL(liveUrlPrefix + live[2], {
            userAgent: userAgent.desktop,
          })
        }
        this.disableDanmakuButton = false
        this.autoHideBar = true
        return
      }

      this.disableDanmakuButton = true
      this.autoHideBar = false

      // 专栏页
      if (url.indexOf('//www.bilibili.com/read/mobile') > -1) {
        if (url.indexOf('//www.bilibili.com/read/cv') > -1) {
          historyStore.replace(url)
          this.webview.loadURL(url, {
            userAgent: userAgent.mobile,
          })
        }
        return
      }

      // 登录页
      if (url.indexOf('//passport.bilibili.com/login') > -1) {
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
    go(url: string) {
      console.log('go', url)
      if (this.webview.getURL() === url) return
      this.webview.loadURL(url, {
        userAgent: judgeUserAgent(url),
      })
    },
    goPart(pid: number) {
      console.log('goPart', pid)
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
      console.log('goBangumiPart', ep)
      this.webview.loadURL(videoUrlPrefix + ep.bvid, {
        userAgent: userAgent.desktop,
      })
    },
  },
})
