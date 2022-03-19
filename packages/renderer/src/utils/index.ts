import { WatchStopHandle } from 'vue'
import { useAppStore } from '@/store'
import type { windowType } from '~/interfaces/view'
import { debounce } from 'lodash'

const { screen, currentWindow, logger } = window.app

export const currentWindowType = ref<windowType>('mobile')

export const resizeMainWindow = (windowType?: windowType): void => {
  const appStore = useAppStore()
  window.ipcRenderer.invoke(`resize-window-size-${appStore.currentWindowID}`, windowType)
}

export const replace = (text: string, map: string[], replacer: string): string => {
  map.forEach((value) => {
    text = text.replace(value, replacer)
  })
  return text
}

// todo 移动到main里 使用hook
export const replaceTitle = (title: string): string => {
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
  return title
}

export const saveWindowSize = (): void => {
  const appStore = useAppStore()
  const resized = debounce(() => {
    // 解决full-reload后会重复绑定事件
    if (currentWindow.isDestroyed()) return
    logger.info('resized')
    const currentSize = appStore.windowSize[currentWindowType.value]
    const newSize: number[] = [window.innerWidth, window.innerHeight]
    if (currentSize !== newSize) {
      appStore.windowSize[currentWindowType.value] = newSize
      appStore.saveConfig('windowSize', toRaw(appStore.windowSize))
      // appStore.saveConfig({ windowSize: toRaw(appStore.windowSize) })
    }
    currentWindow.once('resized', resized)
  }, 500)
  const moved = debounce(() => {
    // 解决full-reload后会重复绑定事件
    if (currentWindow.isDestroyed()) return
    logger.info('moved')
    if (currentWindowType.value === 'mobile') {
      appStore.saveConfig('windowPosition', currentWindow.getPosition())
      // appStore.saveConfig({ windowPosition: currentWindow.getPosition() })
    }
    currentWindow.once('moved', moved)
  }, 500)
  // todo 移动到 main 里
  currentWindow.once('resized', resized)
  currentWindow.once('moved', moved)
}

export const initMouseStateDirtyCheck = (): void => {
  console.log('initMouseStateDirtyCheck')
  const appStore = useAppStore()
  const autoHideBar = computed(() => appStore.autoHideBar)
  const lastStatus = ref<'OUT' | 'IN'>()
  const Fn = () => {
    const mousePos = screen.getCursorScreenPoint()
    const windowPos = currentWindow.getPosition()
    const windowSize = currentWindow.getSize()
    const getTriggerAreaWidth = () => {
      return 0
      // return lastStatus.value === 'IN' ? 0 : 16
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
    window.ipcRenderer.invoke(`top-bar-status-${appStore.currentWindowID}`, {
      autoHideBar: appStore.autoHideBar,
      showTopBar: appStore.showTopBar,
    })
  })
}

export const watchAlwaysOnTop = (): void => {
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
        stopWatchWindowType = watch(
          () => currentWindowType.value,
          (value) => {
            // logger.debug(`currentWindowType - ${value}`)
            if (value === 'mini') {
              return currentWindow.setAlwaysOnTop(true)
            }
            currentWindow.setAlwaysOnTop(false)
          },
          {
            immediate: true,
          },
        )
        break
    }
  })
}
