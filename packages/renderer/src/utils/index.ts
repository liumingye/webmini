import { WatchStopHandle } from 'vue'
import { useAppStore } from '@/store'
import { WindowTypeEnum } from '~/interfaces/view'
import { Timer } from '~/common/timer'
import { replaceAll } from '~/common/string'

const { screen, currentWindow, logger } = window.app

export const currentWindowType = ref<WindowTypeEnum>(WindowTypeEnum.MOBILE)

export const resizeMainWindow = (windowType?: WindowTypeEnum): void => {
  const appStore = useAppStore()
  window.ipcRenderer.invoke(`resize-window-size-${appStore.currentWindowID}`, windowType)
}

// todo 移动到插件里 使用hook
export const replaceTitle = (title: string): string => {
  title = replaceAll(
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

/**
 * 监测鼠标进入离开窗口, 显示隐藏 topbar
 */
export const initMouseStateDirtyCheck = (): void => {
  const appStore = useAppStore()

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
      const minHeight = appStore.showTopBar ? 120 : 32
      return h > minHeight ? h : minHeight
    }

    const isMouseInWindow =
      x > posX &&
      x < posX + windowSize[0] - getTriggerAreaWidth() &&
      y > posY - 10 &&
      y < posY + getTriggerAreaHeight()

    if (isMouseInWindow !== appStore.showTopBar) {
      appStore.showTopBar = isMouseInWindow
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

const watchWindowType = (): WatchStopHandle => {
  return watch(
    () => currentWindowType.value,
    (value) => {
      if (value === WindowTypeEnum.MINI) {
        return currentWindow.setAlwaysOnTop(true)
      }
      currentWindow.setAlwaysOnTop(false)
    },
    {
      immediate: true,
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
        stopWatchWindowType = watchWindowType()
        break
    }
  })
}
