import { WatchStopHandle } from 'vue'
import { useAppStore, useTabsStore } from '@/store'
import { windowType } from '@/types'
import Site from '@/utils/site'
import { clamp, isString } from 'lodash-es'
import { debounce } from 'lodash-es'

const { screen, currentWindow, logger } = window.app

export const currentWindowType = ref<windowType>('mobile')

export const resizeMainWindow = (option: { windowType?: windowType } = {}) => {
  console.log('resizeMainWindow')
  const appStore = useAppStore()
  const tabsStore = useTabsStore()
  const selectedTab = tabsStore.selectedTab()

  const targetWindowType = ref<windowType>()
  if (option.windowType) {
    targetWindowType.value = option.windowType
  } else {
    const url = selectedTab.url
    targetWindowType.value = new Site(url).windowType
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
  bounds.x = clamp(bounds.x, displayBounds.x, displayBounds.width - bounds.width)
  bounds.y = clamp(bounds.y, displayBounds.y, displayBounds.height - bounds.height)
  window.app.currentWindow.setBounds(bounds, true)
  currentWindowType.value = targetWindowType.value
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

/**
 * 测试字符串是否包含子串或匹配正则
 */
export const matchPattern = (str: string) => {
  return (pattern: string | RegExp) => {
    if (isString(pattern)) {
      return str.includes(pattern)
    }
    return pattern.test(str)
  }
}

export const saveWindowSize = () => {
  const appStore = useAppStore()
  const resized = debounce(() => {
    // 解决full-reload后会重复绑定事件
    if (currentWindow.isDestroyed()) return
    logger.info('resized')
    const currentSize = appStore.windowSize[currentWindowType.value]
    const newSize: number[] = [window.innerWidth, window.innerHeight]
    if (currentSize !== newSize) {
      appStore.windowSize[currentWindowType.value] = newSize
      appStore.saveConfig({ windowSize: toRaw(appStore.windowSize) })
    }
    currentWindow.once('resized', resized)
  }, 500)
  const moved = debounce(() => {
    // 解决full-reload后会重复绑定事件
    if (currentWindow.isDestroyed()) return
    logger.info('moved')
    if (currentWindowType.value === 'mobile') {
      appStore.saveConfig({ windowPosition: currentWindow.getPosition() })
    }
    currentWindow.once('moved', moved)
  }, 500)
  currentWindow.once('resized', resized)
  currentWindow.once('moved', moved)
}

export const initMouseStateDirtyCheck = () => {
  const appStore = useAppStore()
  const autoHideBar = computed(() => appStore.autoHideBar)
  const lastStatus = ref<'OUT' | 'IN'>()
  const Fn = () => {
    const mousePos = screen.getCursorScreenPoint()
    const windowPos = currentWindow.getPosition()
    const windowSize = currentWindow.getSize()
    const getTriggerAreaWidth = () => {
      return lastStatus.value === 'IN' ? 0 : 16
    }
    const getTriggerAreaHeight = () => {
      const h = 0.1 * windowSize[1]
      const minHeight = lastStatus.value === 'IN' ? 120 : 36
      return h > minHeight ? h : minHeight
    }
    if (
      mousePos.x > windowPos[0] &&
      mousePos.x < windowPos[0] + windowSize[0] - getTriggerAreaWidth() &&
      mousePos.y > windowPos[1] - 10 &&
      mousePos.y < windowPos[1] + getTriggerAreaHeight()
    ) {
      if (lastStatus.value === 'OUT') {
        appStore.showTopBar = true
        lastStatus.value = 'IN'
      }
      return
    }
    appStore.showTopBar = false
    lastStatus.value = 'OUT'
  }
  const timeout = ref()
  watchEffect(() => {
    logger.debug(`watchEffect - autoHideBar - ${autoHideBar.value}`, { label: 'Main.vue' })
    clearInterval(timeout.value)
    if (autoHideBar.value) {
      timeout.value = setInterval(Fn, 200)
    } else {
      appStore.showTopBar = true
    }
    window.ipcRenderer.invoke(`topBarStatus-${appStore.currentWindowID}`, {
      autoHideBar: appStore.autoHideBar,
      showTopBar: appStore.showTopBar,
    })
  })
}

export const watchAlwaysOnTop = () => {
  const appStore = useAppStore()
  let stopWatchWindowType: WatchStopHandle | null
  watchEffect(() => {
    if (stopWatchWindowType) {
      stopWatchWindowType()
      stopWatchWindowType = null
    }
    switch (appStore.alwaysOnTop) {
      case 'on':
        currentWindow.setAlwaysOnTop(true)
        break
      case 'off':
        currentWindow.setAlwaysOnTop(false)
        break
      default:
        currentWindow.setAlwaysOnTop(false)
        stopWatchWindowType = watch(
          () => currentWindowType.value,
          (value) => {
            // logger.debug(`currentWindowType - ${value}`)
            if (value === 'mini') {
              currentWindow.setAlwaysOnTop(true)
              return
            }
            currentWindow.setAlwaysOnTop(false)
          },
        )
        break
    }
  })
}
