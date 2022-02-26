import { useAppStore } from '@/store'
import { ref } from 'vue'
import { windowType } from './types'
import { userAgent, videoUrlPrefix } from '@/utils/constant'

const ipc = window.ipcRenderer

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
  const rightBottomPosition = [
    leftTopPosition[0] + currentSize[0],
    leftTopPosition[1] + currentSize[1],
  ]
  const targetSize = appStore.windowSize[targetWindowType.value]
  const targetPosition = [
    displayBounds.x + rightBottomPosition[0] - targetSize[0],
    displayBounds.y + rightBottomPosition[1] - targetSize[1],
  ]

  window.app.currentWindow.setBounds(
    {
      x: targetPosition[0],
      y: targetPosition[1],
      width: targetSize[0],
      height: targetSize[1],
    },
    true,
  )

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
        console.log('获取番剧分p数据失败', res)
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      let currentPartId = 0
      try {
        parts = json.epList
        currentPartId = Number(json.epInfo.i)
      } catch (err) {
        console.log(`解析番剧分p失败：${err}`, json)
        return false
      }
      window.app.logger.debug(`获取番剧 ${url} 的分P数据成功`, {
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
  console.log('getPartOfVideo', vid)
  const appStore = useAppStore()
  const net = window.app.net
  net.fetch(videoUrlPrefix + vid).then((res) => {
    res.text().then((res) => {
      // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
      const match = res.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]}]/m)
      if (!match || match?.length < 2) {
        console.log('获取视频分p数据失败', res)
        return false
      }
      const json = JSON.parse(match[1])
      let parts
      try {
        parts = json.videoData.pages
      } catch (err) {
        console.log(`解析视频分p失败：${err}`, json)
        return false
      }
      console.log(`获取视频 ${vid} 的分P数据成功`)
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
  // console.log(_URL)
  if (_URL.hostname.indexOf('.bilibili.com') >= 0) {
    const map = [
      'm.bilibili.com',
      'live.bilibili.com/h5',
      'live.bilibili.com/pages/h5',
      'www.bilibili.com/read/mobile',
      'www.bilibili.com/read/cv',
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
