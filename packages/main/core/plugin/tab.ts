import { app, WebContents } from 'electron'
import { negate, isEmpty } from 'lodash'
import type { PluginMetadata } from '~/interfaces/plugin'
import { hookThemeColor, matchPattern } from '../../utils'
import { removeData, destroyData, registerData } from './data'
import { clearHook } from './hook'
import { Plugin } from './index'

export class TabPlugin {
  public enablePlugins: PluginMetadata[] = []

  public readonly plugins: Plugin

  public constructor(public webContents: WebContents) {
    this.plugins = Plugin.instance
  }

  /**
   * 载入单个插件
   */
  public loadPlugin(url: string) {
    return (plugin: PluginMetadata) => {
      // 若指定了排除URL, 任意URL匹配就不加载
      if (plugin.urlExclude && plugin.urlExclude.some(matchPattern(url))) {
        return undefined
      }

      // 若指定了包含URL, 所有URL都不匹配时不加载
      if (plugin.urlInclude && plugin.urlInclude.every(negate(matchPattern(url)))) {
        return undefined
      }

      if (plugin.preloads) {
        this.webContents.session.setPreloads([
          ...this.webContents.session.getPreloads(),
          ...plugin.preloads,
        ])
      }

      registerData(plugin.name, 'webNav', {})

      this.plugins.loadPlugin(plugin, this.webContents)

      return plugin
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

    if (!isEmpty(res)) {
      hookThemeColor(res[0].name)
    } else {
      hookThemeColor()
    }

    return res
  }

  /**
   * 卸载所有插件
   */
  public unloadTabPlugins(plugins?: PluginMetadata[]): void {
    clearHook()
    if (plugins) {
      // 释放指定插件
      plugins.forEach((item) => {
        removeData(item.name)
        this.plugins.unloadPlugin(item)
        // item.unload()
      })
    } else {
      // 释放全部插件
      destroyData()
      this.enablePlugins.forEach((x) => {
        // if (!x) return
        this.plugins.unloadPlugin(x)
        // x.unload()
      })
    }

    this.webContents.session.setPreloads([])
    this.enablePlugins = []
  }
}
