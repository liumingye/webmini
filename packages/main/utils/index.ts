import { nativeTheme, screen } from 'electron'
import { isString, isEmpty } from 'lodash'
import { Color } from '~/common/color'
import { Application } from '../application'
import is from 'electron-is'
import { Theme } from '~/interfaces'

export const matchPattern = (str: string) => {
  return (pattern: string | RegExp) => {
    if (isString(pattern)) {
      return str.includes(pattern)
    }
    return pattern.test(str)
  }
}

/**
 * 主题色更改
 */
export const hookThemeColor = (): void => {
  const mainWindow = Application.INSTANCE.mainWindow
  if (!mainWindow) return

  let themeData: Theme = { light: { bg: '', text: '' }, dark: { bg: '', text: '' } }

  const view = mainWindow.viewManager.selected
  // console.log(view)
  if (view && !isEmpty(view.plugins) && view.plugins[0].themeColor) {
    themeData = view.plugins[0].themeColor
  }

  const onDarkModeChange = () => {
    if (mainWindow.isDestroyed()) return

    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

    const themeColor = themeData[theme]

    // 未定义背景颜色则获取网页主题色
    if (themeColor && !themeColor.bg) {
      const color = mainWindow.viewManager.selected?.themeColor
      if (color) {
        themeColor.bg = color
      }
    }

    // 未定义文字颜色则自动获取文字颜色
    if (themeColor && !themeColor.text && themeColor.bg) {
      const baseColor = Color.Format.CSS.parseHex(themeColor.bg)
      if (baseColor) {
        const text = baseColor.isDarker() ? baseColor.lighten(100) : baseColor.darken(100)
        if (text) {
          themeColor.text = text.toString()
        }
      }
    }

    mainWindow.send('setThemeColor', {
      theme,
      ...themeColor,
    })
  }

  nativeTheme.removeListener('updated', onDarkModeChange).addListener('updated', onDarkModeChange)

  onDarkModeChange()
}

export const getDisplayBounds = () => {
  // We want the new window to open on the same display that the parent is in
  let displayToUse: Electron.Display | undefined
  const displays = screen.getAllDisplays()
  // Single Display
  if (displays.length === 1) {
    displayToUse = displays[0]
  }
  // Multi Display
  else {
    // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
    if (is.macOS()) {
      const cursorPoint = screen.getCursorScreenPoint()
      displayToUse = screen.getDisplayNearestPoint(cursorPoint)
    }
    // fallback to primary display or first display
    if (!displayToUse) {
      displayToUse = screen.getPrimaryDisplay() || displays[0]
    }
  }
  return displayToUse.bounds
}
