import { PluginMetadata } from './types'
import { addHook, clearHook } from './hook'
import { addData, clearData, registerAndGetData } from './data'
import { negate, once } from 'lodash'
import { WebContents, nativeTheme, app } from 'electron'
import { Application } from '../application'
import { matchPattern } from '../utils'
import Net from '~/common/net'
import is from 'electron-is'
import { Color } from '~/common/color'

// export const pluginsMap: { [name: string]: PluginMetadata } = {}
const getBuiltInPlugins = once(() => {
  const context = is.dev()
    ? import.meta.globEager('../../../resources/plugins/*/index.ts')
    : import.meta.globEager('../../../resources/plugins/*/index.ts')
  const pluginPaths = Object.keys(context)
  return pluginPaths
    .map((path) => {
      const module = context[path]
      if ('plugin' in module) {
        const plugin = module.plugin
        // pluginsMap[plugin.name] = plugin
        return plugin
      }
      return undefined
    })
    .filter((it) => it !== undefined)
})()

class Plugins {
  // public static instance = new this()

  public allPlugins: PluginMetadata[] = getBuiltInPlugins

  public enablePlugins: (PluginMetadata | null)[] = []

  // public url = ''

  public webContents: WebContents

  public constructor(webContents: WebContents) {
    this.webContents = webContents
  }

  /**
   * 载入单个插件
   */
  public loadPlugin(url: string) {
    return (plugin: PluginMetadata) => {
      // const url = this.url
      if (plugin.load) {
        // 若指定了排除URL, 任意URL匹配就不加载
        if (plugin.urlExclude && plugin.urlExclude.some(matchPattern(url))) {
          return null
        }
        // 若指定了包含URL, 所有URL都不匹配时不加载
        if (plugin.urlInclude && plugin.urlInclude.every(negate(matchPattern(url)))) {
          return null
        }
        this.webContents.session.setPreloads([
          ...this.webContents.session.getPreloads(),
          ...plugin.preloads,
        ])
        plugin.load({
          addHook,
          addData,
          net: new Net(),
          application: Application.instance,
          webContents: this.webContents,
        })
        return plugin
      }
      return null
    }
  }

  /**
   * 载入指定url的所有插件
   */
  public loadTabPlugins(url: string) {
    console.log('loadTabPlugins')
    // this.url = url
    this.webContents.session.setPreloads([
      ...this.webContents.session.getPreloads(),
      `${app.getAppPath()}/dist/inject/index.cjs`,
    ])
    const res = this.allPlugins.map(this.loadPlugin(url))
    this.enablePlugins = res
    // this.hookUserAgent()
    this.hookThemeColor()
    return Promise.all(res)
  }

  /**
   * 卸载所有插件
   */
  public unloadTabPlugins() {
    clearHook()
    clearData()
    this.enablePlugins.forEach((x) => {
      if (!x) return
      x.unload({ webContents: this.webContents })
    })
    this.webContents.session.setPreloads([])
    this.enablePlugins = []
  }

  public install() {
    //
  }

  public uninstall() {
    //
  }

  /**
   * 主题色更改
   */
  public hookThemeColor() {
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
      const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      if (!themeColor[theme].text) {
        const baseColor = Color.Format.CSS.parseHex(themeColor[theme].bg)
        if (baseColor) {
          const text = baseColor.isDarker() ? baseColor.darken(1) : baseColor.lighten(1)
          if (text) {
            themeColor[theme].text = text.toString()
          }
        }
        console.log(baseColor)
      }
      Application.instance.mainWindow?.send('setThemeColor', {
        theme,
        ...themeColor[theme],
      })
    }
    onDarkModeChange()
    nativeTheme.on('updated', () => {
      onDarkModeChange
    })
  }
}

export default Plugins
