import { PluginMetadata } from '../../../packages/main/plugins/types'
import {
  videoUrlPrefix,
  bangumiUrlPrefix,
  liveUrlPrefix,
  getVidWithP,
  getBvid,
  getPartOfBangumi,
  getPartOfVideo,
} from './utils'
import { resolve } from 'path'
import is from 'electron-is'

export const plugin: PluginMetadata = {
  name: 'bilibili',
  displayName: '哔哩哔哩',
  urlInclude: [
    'www.bilibili.com',
    'm.bilibili.com',
    'live.bilibili.com',
    'passport.bilibili.com',
    't.bilibili.com',
    'link.bilibili.com',
  ],
  preloads: [
    resolve(
      __dirname,
      is.dev()
        ? '../../resources/plugins/bilibili/dist/index.cjs'
        : '../../../plugins/bilibili/dist/index.cjs',
    ),
  ],
  load: ({ addHook, addData, application, webContents, net }) => {
    const last = {
      vid: '',
    }
    addData('themeColor', (presetBase) => {
      presetBase.light = {
        bg: '#f36f98',
      }
      presetBase.dark = {
        bg: '#f36f98',
      }
    })
    addData('windowType', (presetBase) => {
      presetBase.mini = [
        /(www|m)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/,
        /live\.bilibili\.com\/(blanc|h5|)\/\d+/,
      ]
    })
    addData('userAgent', (presetBase) => {
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
        application.mainWindow?.send('setAppState', 'disableDanmakuButton', true)
        application.mainWindow?.send('setAppState', 'autoHideBar', false)

        const _URL = new URL(url)
        if (['www.bilibili.com', 'm.bilibili.com'].includes(_URL.hostname)) {
          // 视频
          const vid = getVidWithP(_URL.pathname)
          if (vid) {
            if (_URL.hostname === 'm.bilibili.com') {
              webContents.once('did-stop-loading', () => {
                webContents.loadURL(videoUrlPrefix + vid)
              })
              webContents.goBack()
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
              webContents.once('did-stop-loading', () => {
                webContents.loadURL(bangumiUrlPrefix + bvid)
              })
              webContents.goBack()
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
              webContents.once('did-stop-loading', () => {
                webContents.loadURL(liveUrlPrefix + live[2])
              })
              webContents.goBack()
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
  unload: () => {
    //
  },
}
