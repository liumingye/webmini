import { nativeTheme } from 'electron'
import { isString } from 'lodash'
import { Color } from '~/common/color'
import { Application } from '../application'
import { registerAndGetData } from '../core/plugin/data'

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
  const [themeColor]: Theme[] = registerAndGetData('themeColor', themeColorProvider)
  const onDarkModeChange = () => {
    if (Application.instance.mainWindow?.isDestroyed()) return

    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'

    // 未定义文字颜色则自动获取文字颜色
    if (!themeColor[theme].text) {
      const baseColor = Color.Format.CSS.parseHex(themeColor[theme].bg)
      if (baseColor) {
        const text = baseColor.isDarker() ? baseColor.darken(1) : baseColor.lighten(1)
        if (text) {
          themeColor[theme].text = text.toString()
        }
      }
    }

    console.log('主题色更改')

    Application.instance.mainWindow?.send('setThemeColor', {
      theme,
      ...themeColor[theme],
    })
  }
  nativeTheme.removeListener('updated', onDarkModeChange).addListener('updated', onDarkModeChange)
  onDarkModeChange()
}
