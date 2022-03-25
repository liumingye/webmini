import { WatchStopHandle } from 'vue'
import { useAppStore } from '@/store'
import type { windowType } from '~/interfaces/view'
import { debounce } from 'lodash'
import { Timer } from '~/common/timer'

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

// todo 移动到插件里 使用hook
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
    }
    currentWindow.once('resized', resized)
  }, 500)

  const moved = debounce(() => {
    // 解决full-reload后会重复绑定事件
    if (currentWindow.isDestroyed()) return
    logger.info('moved')
    if (currentWindowType.value === 'mobile') {
      appStore.saveConfig('windowPosition', currentWindow.getPosition())
    }
    currentWindow.once('moved', moved)
  }, 500)

  // todo 移动到 main 里
  currentWindow.once('resized', resized)
  currentWindow.once('moved', moved)
}

/**
 * 监测鼠标进入离开窗口, 显示隐藏 topbar
 */
export const initMouseStateDirtyCheck = (): void => {
  // console.log('initMouseStateDirtyCheck')
  const appStore = useAppStore()
  let lastStatus: 'OUT' | 'IN'

  const Fn = () => {
    const { x, y } = screen.getCursorScreenPoint()
    const [posX, posY] = currentWindow.getPosition()
    const windowSize = currentWindow.getSize()

    const getTriggerAreaWidth = () => {
      return 0
      // return lastStatus === 'IN' ? 0 : 16
    }

    const getTriggerAreaHeight = () => {
      const h = 0.1 * windowSize[1]
      const minHeight = lastStatus === 'IN' ? 120 : 32
      return h > minHeight ? h : minHeight
    }

    if (
      x > posX &&
      x < posX + windowSize[0] - getTriggerAreaWidth() &&
      y > posY - 10 &&
      y < posY + getTriggerAreaHeight()
    ) {
      if (lastStatus === 'OUT') {
        appStore.showTopBar = true
        lastStatus = 'IN'
      }
    } else {
      appStore.showTopBar = false
      lastStatus = 'OUT'
    }
  }

  const time = new Timer(Fn, 150, { mode: 'interval' })

  watch(
    () => appStore.autoHideBar,
    (value) => {
      logger.debug(`watchEffect - autoHideBar - ${value}`, { label: 'Main.vue' })

      time.clear()

      if (value) {
        time.start()
      } else {
        appStore.showTopBar = true
      }
    },
  )

  watch(
    () => [appStore.autoHideBar, appStore.showTopBar],
    () => {
      window.ipcRenderer.invoke(`top-bar-status-${appStore.currentWindowID}`, {
        autoHideBar: appStore.autoHideBar,
        showTopBar: appStore.showTopBar,
      })
    },
  )
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
