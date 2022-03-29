import { app } from 'electron'
import fs from 'fs'
import { join, resolve } from 'path'
import Logger from '~/common/logger'
import { isValidKey } from '~/common/object'
import type { AdapterInfo, LocalPluginInfo, PluginMetadata } from '~/interfaces/plugin'
import { PluginStatus } from '~/interfaces/plugin'
import { Application } from '../../application'
import { StorageService } from '../../services/storage'
import { AdapterHandler } from './index'
import { addHook } from './hook'
import { addData } from './data'
import type { PluginDataProvider } from '~/interfaces/plugin'
import Net from '~/common/net'
import axios from 'axios'
import Cookies from '~/common/cookies'
import { createRequire } from 'module'

const requireFresh = createRequire(import.meta.url)

export class Plugin {
  public static instance = new this()

  public readonly allPlugins: PluginMetadata[]

  public readonly baseDir = join(app.getPath('userData'), './plugins')

  public readonly handler: AdapterHandler

  public constructor() {
    this.allPlugins = []

    this.handler = new AdapterHandler({
      baseDir: this.baseDir,
    })

    //  加载本地插件
    this.getLocalPlugins().then((localPlugins) => {
      localPlugins.forEach((p) => {
        this.addPlugin(p.name)
      })
    })
  }

  /**
   * 运行插件加载方法
   * @param plugin
   * @param webContents
   */
  public async loadPlugin(plugin: PluginMetadata, webContents: Electron.WebContents) {
    if (typeof plugin.load === 'function') {
      await plugin.load({
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
        webContents,
        db: new StorageService(plugin.name),
        axios,
        cookies: new Cookies(),
      })
    }
  }

  /**
   * 运行插件释放方法
   * @param plugin
   */
  public async unloadPlugin(plugin: PluginMetadata) {
    if (typeof plugin.unload === 'function') {
      await plugin.unload()
    }
  }

  /**
   * 添加插件
   * @param name
   * @returns
   */
  public async addPlugin(name: string) {
    try {
      const pluginPath = this.getPluginPath(name)

      const pluginPkg = JSON.parse(fs.readFileSync(join(pluginPath, 'package.json'), 'utf8'))

      const pluginImport = requireFresh(resolve(pluginPath, pluginPkg.main))

      this.allPlugins.push(pluginImport.plugin)

      return pluginImport.plugin
    } catch (error) {
      Logger.error(error)
      return false
    }
  }

  /**
   * 删除插件
   * @param name
   * @returns
   */
  public async deletePlugin(name: string) {
    const index = this.allPlugins.findIndex((p) => name === p.name)
    if (index >= 0) {
      await this.unloadPlugin(this.allPlugins[index])
      this.allPlugins.splice(index, 1)
    }
    return this.allPlugins
  }

  /**
   * 获取本地插件
   * @returns
   */
  public async getLocalPlugins(): Promise<LocalPluginInfo[]> {
    const pluginDb = await StorageService.instance.get('pluginDb')
    if (!pluginDb) return []
    const res = Object.keys(pluginDb.data)
      .map((name) => {
        try {
          if (
            isValidKey(name, pluginDb.data) &&
            pluginDb.data[name] === PluginStatus.INSTALLING_COMPLETE
          ) {
            const pluginPath = this.getPluginPath(name)
            const pluginInfo = JSON.parse(
              fs.readFileSync(join(pluginPath, './package.json'), 'utf8'),
            )
            return { ...pluginInfo, status: pluginDb.data[name] }
          }
        } catch (error) {
          Logger.error(error)
        }
      })
      .filter((it) => it !== undefined)
    return res
  }

  /**
   * 获取插件路径
   * @param name
   * @returns
   */
  public getPluginPath(name: string) {
    return resolve(this.baseDir, 'node_modules', name)
  }

  /**
   * 更新插件状态
   * @param plugin
   * @param status
   */
  private async updateStatus(plugin: AdapterInfo, status: PluginStatus) {
    Application.instance.mainWindow?.send('plugin-status-update', plugin, status)

    if (status === PluginStatus.UNINSTALL_FAIL) {
      status = PluginStatus.INSTALLING_COMPLETE
    }

    if ([PluginStatus.INSTALL_FAIL, PluginStatus.UNINSTALL_COMPLETE].includes(status)) {
      const pluginDb = await StorageService.instance.get('pluginDb')
      if (pluginDb) {
        delete pluginDb.data[plugin.name]
        await StorageService.instance.put({
          _id: 'pluginDb',
          data: pluginDb.data,
        })
      }
    } else {
      await StorageService.instance.put({
        _id: 'pluginDb',
        data: { [plugin.name]: status },
      })
    }
  }

  /**
   * 安装插件
   * @param plugin
   * @returns
   */
  public async install(plugin: AdapterInfo) {
    Logger.info(`${plugin.name}@${plugin.version} 开始安装`)
    await this.updateStatus(plugin, PluginStatus.INSTALLING)

    await this.handler
      .install(plugin.name, plugin.version)
      .then(() => {
        Logger.info(`${plugin.name}@${plugin.version} 安装成功`)
        this.addPlugin(plugin.name)
        this.updateStatus(plugin, PluginStatus.INSTALLING_COMPLETE)
      })
      .catch(() => {
        Logger.info(`${plugin.name}@${plugin.version} 安装失败`)
        this.updateStatus(plugin, PluginStatus.INSTALL_FAIL)
      })
  }

  /**
   * 卸载插件
   * @param plugin
   * @returns
   */
  public async uninstall(plugin: AdapterInfo) {
    Logger.info(`开始卸载 - ${plugin.name}`)
    await this.updateStatus(plugin, PluginStatus.UNINSTALLING)

    await this.handler
      .uninstall(plugin.name)
      .then(() => {
        Logger.info(`卸载成功 - ${plugin.name}`)
        this.deletePlugin(plugin.name)
        this.updateStatus(plugin, PluginStatus.UNINSTALL_COMPLETE)
      })
      .catch(() => {
        Logger.info(`卸载失败 - ${plugin.name}`)
        this.updateStatus(plugin, PluginStatus.UNINSTALL_FAIL)
      })
  }
}
