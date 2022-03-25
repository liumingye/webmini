import { app, WebContents } from 'electron'
import { negate } from 'lodash'
import Net from '~/common/net'
import type { PluginMetadata, PluginDataProvider } from '~/interfaces/plugin'
import { Application } from '../../application'
import { hookThemeColor, matchPattern } from '../../utils'
import { MainWindow } from '../../windows/main'
import { addData, clearData, registerData } from './data'
import { addHook, clearHook } from './hook'
import { Plugin } from './index'
import { StorageService } from '../../services/storage'
import axios from 'axios'
import Cookies from '~/common/cookies'

export class TabPlugin {
  public enablePlugins: PluginMetadata[] = []

  public readonly plugins: Plugin

  public constructor(private window: MainWindow, public webContents: WebContents) {
    this.plugins = Plugin.instance
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

        registerData(plugin.name, 'webNav', {
          search: {},
          nav: {},
        })

        plugin.load({
          // addHook: (key: string, ...data: any[]) => {
          //   addHook(plugin.name, key, data)
          // },
          addHook,
          addData: (key: string, provider: PluginDataProvider) => {
            addData(plugin.name, key, provider)
          },
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
          db: new StorageService(plugin.name),
          axios,
          cookies: new Cookies(),
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

    if (res.length !== 0) {
      hookThemeColor(res[0].name)
    } else {
      hookThemeColor()
    }

    return res
  }

  /**
   * 卸载所有插件
   */
  public unloadTabPlugins(): void {
    clearHook()
    clearData()
    this.enablePlugins.forEach((x) => {
      if (!x) return
      x.unload()
    })
    this.webContents.session.setPreloads([])
    this.enablePlugins = []
  }
}
