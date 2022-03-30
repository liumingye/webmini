import { app, WebContents } from 'electron'
import { negate, isEmpty, clone } from 'lodash'
import type { PluginMetadata } from '~/interfaces/plugin'
import { hookThemeColor, matchPattern } from '../../utils'
import { removeData, destroyData, registerData } from './data'
import { clearHook } from './hook'
import { Plugin } from './index'

export class TabPlugin {
  public readonly enablePlugins: PluginMetadata[] = []

  public readonly plugins: Plugin

  public constructor(public webContents: WebContents) {
    this.plugins = Plugin.instance
  }

  /**
   * 载入单个插件
   * @param url
   * @returns
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

      this.enablePlugins.push(plugin)

      return plugin
    }
  }

  /**
   * 载入指定url的所有插件
   * @param url
   * @returns
   */
  public loadTabPlugins(url: string) {
    // 优先将inject加载到webview中
    const preloads = this.webContents.session.getPreloads()
    const injectPath = `${app.getAppPath()}/dist/inject/index.cjs`
    if (preloads.indexOf(injectPath) === -1) {
      preloads.push(injectPath)
    }
    this.webContents.session.setPreloads(preloads)

    const res = this.plugins.allPlugins
      .map(this.loadPlugin(url))
      .filter((it) => !!it) as typeof this.plugins.allPlugins

    if (!isEmpty(res)) {
      hookThemeColor(res[0].name)
    } else {
      hookThemeColor()
    }

    return res
  }

  /**
   * 释放所有插件或指定插件
   * @param plugins 需要释放的插件
   */
  public unloadTabPlugins(plugins?: PluginMetadata[]): void {
    clearHook()
    if (plugins) {
      // 释放指定插件
      plugins.forEach((plugin) => {
        removeData(plugin.name)

        this.plugins.unloadPlugin(plugin)

        const preloads = this.webContents.session.getPreloads()
        const newPreloads = clone(preloads).reduce((result, preload) => {
          if (plugin.preloads.indexOf(preload) === -1) {
            result.push(preload)
          }
          return result
        }, [] as typeof preloads)
        this.webContents.session.setPreloads(newPreloads)

        const index = this.enablePlugins.indexOf(plugin)
        if (index > -1) {
          this.enablePlugins.splice(index, 1)
        }
      })
    } else {
      // 释放全部插件
      destroyData()
      this.enablePlugins.forEach((plugin) => {
        this.plugins.unloadPlugin(plugin)
      })
      this.webContents.session.setPreloads([])
      this.enablePlugins.length = 0
    }
  }
}
