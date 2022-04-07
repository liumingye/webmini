import { app, WebContents } from 'electron'
import { negate } from 'lodash'
import type { PluginMetadata } from '~/interfaces/plugin'
import { matchPattern } from '../../utils'
import { Plugin } from './index'

export class TabPlugin {
  public readonly enablePlugins: PluginMetadata[] = []

  public readonly plugins: Plugin

  public constructor(public webContents: WebContents) {
    this.plugins = new Plugin()
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

      // 插入插件的preloads, 并且过滤已存在的preload
      if (plugin.preloads) {
        const preloads = this.webContents.session.getPreloads()
        plugin.preloads.forEach((preload) => {
          if (preloads.indexOf(preload) === -1) {
            preloads.push(preload)
          }
        })
        this.webContents.session.setPreloads(preloads)
      }

      // 加载插件
      this.plugins.loadPlugin(plugin)

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

    return res
  }

  /**
   * 释放所有插件或指定插件
   * @param plugins 需要释放的插件
   */
  public unloadTabPlugins(plugins?: PluginMetadata[]): void {
    let _plugins = []

    if (plugins) {
      _plugins = plugins
      // 从enablePlugins中移除
      plugins.forEach((plugin) => {
        const index = this.enablePlugins.indexOf(plugin)
        if (index > -1) {
          this.enablePlugins.splice(index, 1)
        }
      })
    } else {
      _plugins = this.enablePlugins
      // 清空enablePlugins
      this.enablePlugins.length = 0
    }

    // 释放插件 & 移除preloads
    for (const plugin of _plugins) {
      // 释放插件
      this.plugins.unloadPlugin(plugin)

      // 移除插件的preloads
      if (plugin.preloads) {
        const preloads = this.webContents.session.getPreloads()
        for (const preload of plugin.preloads) {
          const index = preloads.indexOf(preload)
          if (index === -1) continue
          preloads.splice(index, 1)
        }
        this.webContents.session.setPreloads(preloads)
      }
    }
  }
}
