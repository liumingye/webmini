import { useAppStore } from '@/store'
import { windowType } from '@/types'
import Site from '@/utils/site'

const logger = window.app.logger

export const currentWindowType = ref<windowType>('mobile')

export const resizeMainWindow = (windowType?: windowType) => {
  const appStore = useAppStore()
  const targetWindowType = ref<windowType>()
  if (!windowType) {
    const url = appStore.webview.getURL()
    targetWindowType.value = new Site(url).getWindowType()
  } else {
    targetWindowType.value = windowType
  }
  if (targetWindowType.value === currentWindowType.value) {
    return
  }
  logger.debug(`targetWindowType - ${targetWindowType.value}`)
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
  const width = appStore.windowSize[targetWindowType.value][0]
  const height = appStore.windowSize[targetWindowType.value][1]
  const x = displayBounds.x + rightBottomPosition.x - width
  const y = displayBounds.y + rightBottomPosition.y - height
  const bounds: Required<Electron.Rectangle> = { width, height, x, y }
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

export const replace = (text: string, map: string[], replacer: string) => {
  map.forEach((value) => {
    text = text.replace(value, replacer)
  })
  return text
}

export const replaceTitle = (title: string) => {
  title = replace(
    title,
    [
      '_哔哩哔哩_bilibili',
      '-高清正版在线观看-bilibili-哔哩哔哩',
      ' - 哔哩哔哩弹幕视频网 - ( ゜- ゜)つロ 乾杯~',
      '哔哩哔哩 (゜-゜)つロ 干杯~-',
    ],
    '',
  )
  title = replace(title, ['bilibili', '哔哩哔哩'], 'bilimini')
  return title
}
