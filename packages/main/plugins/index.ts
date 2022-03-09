import { PluginMetadata } from './types'
import { addHook, clearHook } from './hook'
import { addData, clearData, registerAndGetData } from './data'
import { negate, once } from 'lodash'
import { WebContents, nativeTheme } from 'electron'
import { Application } from '../application'
import { matchPattern } from '../utils'
import Net from '~/preload/apis/net'

// export const pluginsMap: { [name: string]: PluginMetadata } = {}
const getBuiltInPlugins = once(() => {
  const context = import.meta.globEager('./builtIn/*/index.ts')
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
    // this.url = url
    const res = this.allPlugins.map(this.loadPlugin(url))
    this.enablePlugins = res
    // this.hookUserAgent()
    this.hookThemeColor()
    return Promise.allSettled(res)
  }

  /**
   * 卸载所有插件
   */
  public unloadTabPlugins() {
    clearHook()
    clearData()
    this.enablePlugins.forEach((x) => {
      if (!x) return
      x.unload()
    })
    this.enablePlugins = []
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
      Application.instance.mainWindow?.send('setThemeColor', {
        theme,
        ...themeColor[theme],
      })
    }
    nativeTheme.on('updated', () => {
      onDarkModeChange()
    })
    onDarkModeChange()
  }
}

export default Plugins
