import { PluginMetadata } from '@/store/modules/plugin/types'
import {
  videoUrlPrefix,
  bangumiUrlPrefix,
  liveUrlPrefix,
  getVidWithP,
  getBvid,
  getPartOfBangumi,
  getPartOfVideo,
} from './utils'
import { useAppStore, useHistoryStore } from '@/store'
import { userAgent } from '@/utils/constant'
import { loadURL } from '@/utils/view'

const last = reactive({
  vid: '',
})

export const plugin: PluginMetadata = {
  name: 'bilibili',
  displayName: '哔哩哔哩',
  urlInclude: [
    'www.bilibili.com',
    'm.bilibili.com',
    'live.bilibili.com',
    'passport.bilibili.com',
    't.bilibili.com',
  ],
  options: {
    windowType: {
      mini: [
        /(www|m)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/,
        /live\.bilibili\.com\/(blanc|h5|)\/\d+/,
      ],
    },
  },
  setup: ({ addHook, addData }) => {
    addData('themeColor', (presetBase: Record<string, Record<string, string>>) => {
      presetBase.light = {
        bg: '#f36f98',
        text: '#fff',
      }
      presetBase.dark = {
        bg: '#f36f98',
        text: '#fff',
      }
    })
    addData('windowType', (presetBase: Record<string, (string | RegExp)[]>) => {
      presetBase.mini = [
        /(www|m)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/,
        /live\.bilibili\.com\/(blanc|h5|)\/\d+/,
      ]
    })
    addData('userAgent', (presetBase: Record<string, string[]>) => {
      presetBase.mobile = [
        'm.bilibili.com/',
        'live.bilibili.com/h5',
        'live.bilibili.com/pages/h5',
        'www.bilibili.com/read/mobile',
        'www.bilibili.com/read/cv',
        'h.bilibili.com/ywh/h5',
        't.bilibili.com/',
      ]
    })
    addHook('updateUrl', {
      after: ({ url }: { url: URL }) => {
        const appStore = useAppStore()
        const historyStore = useHistoryStore()

        if (['www.bilibili.com', 'm.bilibili.com'].includes(url.hostname)) {
          // 视频
          const vid = getVidWithP(url.pathname)
          if (vid) {
            if (url.hostname === 'm.bilibili.com') {
              // callViewMethod(tabsStore.selectedTabId, 'goBack')
              historyStore.pop()
              loadURL(videoUrlPrefix + vid, {
                userAgent: userAgent.desktop,
              })
            } else if (url.hostname === 'www.bilibili.com') {
              if (vid !== last.vid) {
                getPartOfVideo(vid)
                last.vid = vid
              }
            }
            appStore.disableDanmakuButton = false
            appStore.autoHideBar = true
            if (appStore.windowID.selectPartWindow) {
              const m = /p=(\d+)/.exec(url.href)
              const currentPartId = m ? Number(m[1]) - 1 : 0
              window.ipcRenderer.sendTo(
                appStore.windowID.selectPartWindow,
                'update-currentPartId',
                currentPartId,
              )
            }
            return
          }

          // 番剧
          const bvid = getBvid(url.pathname)
          if (bvid) {
            if (url.hostname === 'm.bilibili.com') {
              historyStore.pop()
              loadURL(bangumiUrlPrefix + bvid, {
                userAgent: userAgent.desktop,
              })
            }
            getPartOfBangumi(bvid)
            appStore.disableDanmakuButton = false
            appStore.autoHideBar = true
            return
          }
        }

        // 直播
        if (url.hostname === 'live.bilibili.com') {
          const live = /^\/(h5\/||blanc\/)?(\d+).*/.exec(url.pathname)
          if (live) {
            if (live[1] === 'h5/') {
              historyStore.pop()
              loadURL(liveUrlPrefix + live[2], {
                userAgent: userAgent.desktop,
              })
            }
            appStore.disableDanmakuButton = false
            appStore.autoHideBar = true
            return
          }
        }

        // 专栏页
        if (url.href.indexOf('//www.bilibili.com/read/cv') >= 0) {
          historyStore.pop()
          return
        }

        // 登录页
        if (url.href.indexOf('//passport.bilibili.com/login') >= 0) {
          loadURL(url.href, {
            userAgent: userAgent.desktop,
          })
          return
        }

        if (appStore.windowID.selectPartWindow) {
          window.ipcRenderer.sendTo(appStore.windowID.selectPartWindow, 'update-part', null)
        }
      },
    })
  },
}
