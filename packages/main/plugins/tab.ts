import type { PluginMetadata } from '~/interfaces/plugin'
import { addHook, clearHook } from './hook'
import { addData, clearData, registerAndGetData } from './data'
import { negate } from 'lodash'
import { WebContents, nativeTheme, app } from 'electron'
import { Application } from '../application'
import { matchPattern, hookThemeColor } from '../utils'
import Net from '~/common/net'
import { Color } from '~/common/color'
import { MainWindow } from '../windows/main'
import Plugins from './index'

class TabPlugin {
  public enablePlugins: PluginMetadata[] = []

  private window: MainWindow

  public webContents: WebContents

  public plugins: Plugins

  public constructor(window: MainWindow, webContents: WebContents) {
    this.window = window
    this.webContents = webContents
    this.plugins = Plugins.instance
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

        plugin.load({
          addHook,
          addData,
          net: new Net(),
          application: {
            mainWindow: {
              send: Application.instance.mainWindow?.send,
            },
            selectPartWindow: {
              send: Application.instance.selectPartWindow?.send,
            },
          },
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

    // console.log(this.allPlugins)
    const res = this.plugins.allPlugins
      .map(this.loadPlugin(url))
      .filter((it) => it !== undefined) as PluginMetadata[]

    this.enablePlugins = res

    hookThemeColor()

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
}

export default TabPlugin
