import { useAppStore } from '@/store'
import { windowType } from './types'
import { userAgent, videoUrlPrefix } from '@/utils/constant'

const ipc = window.ipcRenderer
const logger = window.app.logger

export const currentWindowType = ref<windowType>('mobile')

export const resizeMainWindow = (windowType?: windowType) => {
  const appStore = useAppStore()
  const targetWindowType = ref<windowType>()
  if (!windowType) {
    const url = appStore.webview.getURL()
    if (
      /\/\/(www|m)\.bilibili\.com\/(video\/(av|BV)|bangumi\/play\/)/.test(url) ||
      /\/\/live\.bilibili\.com\/(blanc|h5)\/\d+/.test(url)
    ) {
      targetWindowType.value = 'mini'
    } else if (url.indexOf('//passport.bilibili.com/login') >= 0) {
      targetWindowType.value = 'login'
    } else if (url.indexOf('//t.bilibili.com/?tab') >= 0) {
      targetWindowType.value = 'feed'
    } else if (appStore.webview.getUserAgent() === userAgent.desktop) {
      targetWindowType.value = 'desktop'
    } else {
      targetWindowType.value = 'mobile'
    }
  } else {
    targetWindowType.value = windowType
  }
  if (targetWindowType.value === currentWindowType.value) {
    return
  }

  // We want the new window to open on the same display that the parent is in
  let displayToUse: Electron.Display | undefined
  const screen = window.app.screen
  const displays = screen.getAllDisplays()
  // Single Display
  if (displays.length === 1) {
    displayToUse = displays[0]
  }
  // Multi Display
  else {
    // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
    if (window.app.versions.OS.indexOf('darwin') >= 0) {
      const cursorPoint = screen.getCursorScreenPoint()
      displayToUse = screen.getDisplayNearestPoint(cursorPoint)
    }
    // fallback to primary display or first display
    if (!displayToUse) {
      displayToUse = screen.getPrimaryDisplay() || displays[0]
    }
  }

  const displayBounds = displayToUse.bounds
  const currentSize = window.app.currentWindow.getSize()
  const leftTopPosition = window.app.currentWindow.getPosition()
  const rightBottomPosition = {
    x: leftTopPosition[0] + currentSize[0],
    y: leftTopPosition[1] + currentSize[1],
  }
  const bounds: Partial<Electron.Rectangle> = {}
  bounds.width = appStore.windowSize[targetWindowType.value][0]
  bounds.height = appStore.windowSize[targetWindowType.value][1]
  bounds.x = displayBounds.x + rightBottomPosition.x - bounds.width
  bounds.y = displayBounds.y + rightBottomPosition.y - bounds.height
  // 防止超出屏幕可视范围
  if (bounds.x < displayBounds.x) {
    bounds.x = displayBounds.x
  } else if (bounds.x > displayBounds.width - bounds.width) {
    bounds.x = displayBounds.width - bounds.width
  }
  if (bounds.y < displayBounds.y) {
    bounds.y = displayBounds.y
  } else if (bounds.y > displayBounds.height - bounds.height) {
    bounds.y = displayBounds.height - bounds.height
  }
  window.app.currentWindow.setBounds(bounds, true)
  currentWindowType.value = targetWindowType.value
}

export const getVidWithP = (pathname: string) => {
  const m = /^\/video\/((av\d+|BV\w+)(?:\/?\?p=\d+)?)/.exec(pathname)
  return m ? m[1] : null
}

export const getBvid = (pathname: string) => {
  const m = /^\/bangumi\/play\/(ss\d+|ep\d+)/.exec(pathname)
  return m ? m[1] : null
}

export const getVid = (url: string) => {
  const m = /video\/(av\d+|BV\w+)/.exec(url)
  return m ? m[1] : null
}

export const getPartOfBangumi = (url: string) => {
  const appStore = useAppStore()
  const net = window.app.net
  net.fetch(url).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        logger.error(`获取番剧分p数据失败`, {
          data: res,
          label: 'getPartOfBangumi',
        })
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      let currentPartId = 0
      try {
        parts = json.epList
        currentPartId = Number(json.epInfo.i)
      } catch (err) {
        logger.error(`解析番剧分p失败`, {
          error: err,
          data: json,
          label: 'getPartOfBangumi',
        })
        return false
      }
      logger.debug(`获取番剧 ${url} 的分P数据成功`, {
        label: 'getPartOfBangumi',
      })
      if (parts.length) {
        if (!appStore.windowID.selectPartWindow) return
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-bangumi-part', {
          currentPartId,
          parts: parts.map((p: any) => {
            return {
              epid: p.i,
              // aid: p.aid,
              bvid: p.bvid,
              title: p.longTitle,
            }
          }),
        })
        if (parts.length > 1) {
          // ipc.send("show-select-part-window");
          appStore.disablePartButton = false
        }
      } else {
        if (!appStore.windowID.selectPartWindow) return
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-part', null)
        appStore.disablePartButton = true
      }
    })
  })
}

export const getPartOfVideo = (vid: string) => {
  const appStore = useAppStore()
  const net = window.app.net
  net.fetch(videoUrlPrefix + vid).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        logger.error(`获取视频分p数据失败`, {
          data: res,
          label: 'getPartOfVideo',
        })
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      try {
        parts = json.videoData.pages
      } catch (err) {
        logger.error(`解析视频分p失败`, {
          error: err,
          data: json,
          label: 'getPartOfVideo',
        })
        return false
      }
      logger.debug(`获取视频 ${vid} 的分P数据成功`, {
        label: 'getPartOfBangumi',
      })
      if (parts.length) {
        if (!appStore.windowID.selectPartWindow) return
        ipc.sendTo(
          appStore.windowID.selectPartWindow,
          'update-part',
          parts.map((p: { part: [] }) => p.part),
        )
        // 有超过1p时自动开启分p窗口
        if (parts.length > 1) {
          ipc.send('show-select-part-window')
          appStore.disablePartButton = false
        }
      } else {
        if (!appStore.windowID.selectPartWindow) return
        ipc.sendTo(appStore.windowID.selectPartWindow, 'update-part', null)
        appStore.disablePartButton = true
      }
    })
  })
}

export const judgeUserAgent = (url: string) => {
  const _URL = new URL(url)
  if (_URL.hostname.indexOf('.bilibili.com') >= 0) {
    const map = [
      'm.bilibili.com',
      'live.bilibili.com/h5',
      'live.bilibili.com/pages/h5',
      'www.bilibili.com/read/mobile',
      'www.bilibili.com/read/cv',
      'h.bilibili.com/ywh/h5',
      't.bilibili.com',
    ]
    for (let i = 0; i < map.length; i++) {
      const completeURL = _URL.hostname + _URL.pathname
      if (completeURL.indexOf(map[i]) >= 0) {
        return userAgent.mobile
      }
    }
  }
  return userAgent.desktop
}
