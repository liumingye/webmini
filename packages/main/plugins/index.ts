import { PluginMetadata } from './types'
import { addHook, clearHook } from './hook'
import { addData, clearData, registerAndGetData } from './data'
import { negate, once } from 'lodash'
import { WebContents, nativeTheme, app } from 'electron'
import { Application } from '../application'
import { matchPattern } from '../utils'
import Net from '~/common/net'
import { Color } from '~/common/color'
import { MainWindow } from '../windows/main'
import AdapterHandler from './handler'
import { join, resolve } from 'path'
import fs from 'fs'

const baseDir = join(app.getPath('userData'), './plugins')

export const pluginsMap: { [name: string]: PluginMetadata } = {}
// const getBuiltInPlugins = once(() => {
//   const context = import.meta.globEager('../../../resources/plugins/*/index.ts.bak')
//   const pluginPaths = Object.keys(context)
//   return pluginPaths
//     .map((path) => {
//       const module = context[path]
//       if ('plugin' in module) {
//         const plugin = module.plugin
//         pluginsMap[plugin.name] = plugin
//         return plugin
//       }
//       return undefined
//     })
//     .filter((it) => it !== undefined)
// })()

class Plugins {
  public allPlugins: PluginMetadata[]

  public enablePlugins: PluginMetadata[] = []

  private window: MainWindow

  public webContents: WebContents

  public handler: AdapterHandler

  public constructor(window: MainWindow, webContents: WebContents) {
    this.window = window
    this.webContents = webContents

    this.allPlugins = []

    this.handler = new AdapterHandler({
      baseDir,
    })

    const plugin = {
      name: 'webmini-bilibili',
    }
    const pluginPath = resolve(baseDir, 'node_modules', plugin.name)
    const pluginInfo = JSON.parse(fs.readFileSync(join(pluginPath, './package.json'), 'utf8'))
    const _load = import(resolve(pluginPath, pluginInfo.main))
    _load.then((res) => {
      this.allPlugins.push(res.plugin)
    })
  }

  /**
   * 载入单个插件
   */
  public loadPlugin(url: string) {
    return (plugin: PluginMetadata) => {
      if (plugin.load) {
        // 若指定了排除URL, 任意URL匹配就不加载
        if (plugin.urlExclude && plugin.urlExclude.some(matchPattern(url))) {
          return undefined
        }
        // 若指定了包含URL, 所有URL都不匹配时不加载
        if (plugin.urlInclude && plugin.urlInclude.every(negate(matchPattern(url)))) {
          return undefined
        }
        this.webContents.session.setPreloads([
          ...this.webContents.session.getPreloads(),
          ...plugin.preloads,
        ])
        console.log(this.webContents.session.getPreloads())
        plugin.load({
          addHook,
          addData,
          net: new Net(),
          application: Application.instance,
          webContents: this.webContents,
        })
        return plugin
      }
      return undefined
    }
  }

  /**
   * 载入指定url的所有插件
   */
  public loadTabPlugins(url: string) {
    this.webContents.session.setPreloads([
      ...this.webContents.session.getPreloads(),
      `${app.getAppPath()}/dist/inject/index.cjs`,
    ])
    console.log(this.allPlugins)
    const res = this.allPlugins
      .map(this.loadPlugin(url))
      .filter((it) => it !== undefined) as PluginMetadata[]
    this.enablePlugins = res
    this.hookThemeColor()
    return Promise.all(res)
  }

  /**
   * 卸载所有插件
   */
  public unloadTabPlugins(): void {
    clearHook()
    clearData()
    this.enablePlugins.forEach((x) => {
      if (!x) return
      x.unload({ webContents: this.webContents })
    })
    this.webContents.session.setPreloads([])
    this.enablePlugins = []
  }

  public install(): void {
    //
  }

  public uninstall(): void {
    //
  }

  /**
   * 主题色更改
   */
  public hookThemeColor(): void {
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
      this.window.send('setThemeColor', {
        theme,
        ...themeColor[theme],
      })
    }
    onDarkModeChange()
    nativeTheme.on('updated', () => {
      onDarkModeChange()
    })
  }
}

export default Plugins
