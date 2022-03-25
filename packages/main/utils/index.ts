import { nativeTheme, screen } from 'electron'
import { isString } from 'lodash'
import { Color } from '~/common/color'
import { Application } from '../application'
import { registerAndGetData } from '../core/plugin/data'
import is from 'electron-is'

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
export const hookThemeColor = (pluginName?: string): void => {
  type Color = {
    bg: string
    text: string
  }

  type Theme = {
    light: Color
    dark: Color
  }

  const themeColorProvider = {
    light: {
      bg: '',
      text: '',
    },
    dark: {
      bg: '',
      text: '',
    },
  }

  let themeColor: Theme = themeColorProvider

  if (pluginName) {
    themeColor = registerAndGetData(pluginName, 'themeColor', themeColorProvider)[0]
  }

  const onDarkModeChange = () => {
    if (Application.instance.mainWindow?.isDestroyed()) return

    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

    if (!themeColor[theme].bg) {
      const color = Application.instance.mainWindow?.viewManager.selected?.themeColor
      if (color) {
        themeColor[theme].bg = color
      }
    }

    // 未定义文字颜色则自动获取文字颜色
    if (!themeColor[theme].text) {
      const baseColor = Color.Format.CSS.parseHex(themeColor[theme].bg)
      if (baseColor) {
        const text = baseColor.isDarker() ? baseColor.lighten(1) : baseColor.darken(1)
        console.log('isDarker', baseColor.isDarker())
        if (text) {
          themeColor[theme].text = text.toString()
        }
      }
    }

    // console.log('主题色更改', themeColor)

    Application.instance.mainWindow?.send('setThemeColor', {
      theme,
      ...themeColor[theme],
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
