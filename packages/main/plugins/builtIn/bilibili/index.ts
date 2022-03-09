import { PluginMetadata } from '../../types'
import {
  videoUrlPrefix,
  bangumiUrlPrefix,
  liveUrlPrefix,
  getVidWithP,
  getBvid,
  getPartOfBangumi,
  getPartOfVideo,
} from './utils'
// import { useAppStore, useHistoryStore } from '@/store'
// import { userAgent } from '~/renderer/src/utils/constant'
// import { ipcMain } from 'electron'
// import { loadURL } from '@/utils/view'

const last = {
  vid: '',
}

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
  unload: () => {
    //
  },
  load: ({ addHook, addData, application, webContents, net }) => {
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
      presetBase.desktop = ['passport.bilibili.com/login']
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
      after: ({ url }: { url: string }) => {
        console.log('updateUrl - after - ' + url)

        application.mainWindow?.send('setAppState', 'disableDanmakuButton', true)
        application.mainWindow?.send('setAppState', 'autoHideBar', false)

        console.log(url + ' aaaaaa')
        const _URL = new URL(url)
        if (['www.bilibili.com', 'm.bilibili.com'].includes(_URL.hostname)) {
          // 视频
          const vid = getVidWithP(_URL.pathname)
          if (vid) {
            if (_URL.hostname === 'm.bilibili.com') {
              webContents.goBack()
              webContents.loadURL(videoUrlPrefix + vid)
            } else if (_URL.hostname === 'www.bilibili.com') {
              if (vid !== last.vid) {
                getPartOfVideo(application, net, vid)
                last.vid = vid
                application.mainWindow?.send('setAppState', 'disableDanmakuButton', false)
                application.mainWindow?.send('setAppState', 'autoHideBar', true)
                const m = /p=(\d+)/.exec(_URL.pathname)
                const currentPartId = m ? Number(m[1]) - 1 : 0
                application.selectPartWindow?.send('update-currentPartId', currentPartId)
              }
            }
            return
          }

          // 番剧
          const bvid = getBvid(_URL.pathname)
          if (bvid) {
            if (_URL.hostname === 'm.bilibili.com') {
              webContents.goBack()
              webContents.loadURL(bangumiUrlPrefix + bvid)
            } else if (_URL.hostname === 'www.bilibili.com') {
              getPartOfBangumi(application, net, bvid)
              application.mainWindow?.send('setAppState', 'disableDanmakuButton', false)
              application.mainWindow?.send('setAppState', 'autoHideBar', true)
            }
            return
          }
        }

        // 直播
        if (_URL.hostname === 'live.bilibili.com') {
          const live = /^\/(h5\/||blanc\/)?(\d+).*/.exec(_URL.pathname)
          if (live) {
            if (live[1] === 'h5/') {
              webContents.goBack()
              webContents.loadURL(liveUrlPrefix + live[2])
            } else {
              application.mainWindow?.send('setAppState', 'disableDanmakuButton', false)
              application.mainWindow?.send('setAppState', 'autoHideBar', true)
            }
            return
          }
        }

        application.mainWindow?.send('setAppState', 'disablePartButton', true)
        application.selectPartWindow?.send('update-part', null)
      },
    })
  },
}
