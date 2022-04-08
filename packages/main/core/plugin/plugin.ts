import axios from 'axios'
import { app } from 'electron'
import fs from 'fs'
import { isString } from 'lodash'
import { createRequire } from 'module'
import { join, resolve } from 'path'
import Cookies from '~/common/cookies'
import Logger from '~/common/logger'
import Net from '~/common/net'
import { isURI } from '~/common/uri'
import type { AdapterInfo, LocalPluginInfo, PluginMetadata } from '~/interfaces/plugin'
import { PluginStatus } from '~/interfaces/plugin'
import { Application } from '../../application'
import { StorageService } from '../../services/storage'
import { AdapterHandler } from './handler'

const requireFresh = createRequire(import.meta.url)
const baseDir = join(app.getPath('userData'), './plugins')

export class Plugin {
  // 插件实例
  public static INSTANCE = new this()

  private _allPlugins: PluginMetadata[]
  public get allPlugins(): PluginMetadata[] {
    return this._allPlugins
  }
  private set allPlugins(value: PluginMetadata[]) {
    // 更新静态数据
    this._allPlugins = Plugin.INSTANCE.allPlugins = value
  }

  private readonly handler: AdapterHandler

  public constructor() {
    this._allPlugins = []

    this.handler = new AdapterHandler({
      baseDir,
    })

    //  加载本地插件
    this.getLocalPlugins().then((localPlugins) => {
      localPlugins.forEach((plugin) => {
        this.addPlugin(plugin.name)
      })
    })
  }

  /**
   * 运行插件加载方法
   * @param plugin
   */
  public async loadPlugin(plugin: PluginMetadata) {
    if (typeof plugin.load === 'function') {
      await plugin.load()
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

      const pluginApi = {
        net: new Net(),
        application: {
          mainWindow: {
            send: Application.INSTANCE.mainWindow?.send.bind(Application.INSTANCE.mainWindow),
          },
          selectPartWindow: {
            send: Application.INSTANCE.selectPartWindow?.send.bind(
              Application.INSTANCE.selectPartWindow,
            ),
          },
        },
        db: new StorageService(pluginPkg.name),
        axios,
        cookies: new Cookies(),
      }

      const plugin = new pluginImport.extension(pluginApi)

      plugin.name = pluginPkg.name

      this.allPlugins.push(plugin)

      return plugin
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
    const pluginDb = await StorageService.INSTANCE.get('pluginDb')
    if (!pluginDb) return []
    const res = Object.entries(pluginDb.data).reduce((previousValue, currentValue) => {
      try {
        const [name, status] = currentValue
        if (status === PluginStatus.INSTALLING_COMPLETE) {
          const pluginPath = this.getPluginPath(name)
          const pluginInfo: LocalPluginInfo = JSON.parse(
            fs.readFileSync(join(pluginPath, 'package.json'), 'utf8'),
          )
          if (pluginInfo.icon && isString(pluginInfo.icon) && !isURI(pluginInfo.icon)) {
            pluginInfo.icon = join(pluginPath, pluginInfo.icon)
          }
          previousValue.push({ ...pluginInfo, status })
        }
      } catch (error) {
        Logger.error(error)
      }
      return previousValue
    }, [] as LocalPluginInfo[])
    return res
  }

  /**
   * 获取插件路径
   * @param name
   * @returns
   */
  public getPluginPath(name: string) {
    return resolve(baseDir, 'node_modules', name)
  }

  /**
   * 更新插件状态
   * @param plugin
   * @param status
   */
  private async updateStatus(plugin: AdapterInfo, status: PluginStatus) {
    Application.INSTANCE.mainWindow?.send('plugin-status-update', plugin, status)

    if (status === PluginStatus.UNINSTALL_FAIL) {
      status = PluginStatus.INSTALLING_COMPLETE
    }

    if ([PluginStatus.INSTALL_FAIL, PluginStatus.UNINSTALL_COMPLETE].includes(status)) {
      const pluginDb = await StorageService.INSTANCE.get('pluginDb')
      if (pluginDb) {
        delete pluginDb.data[plugin.name]
        await StorageService.INSTANCE.put({
          _id: 'pluginDb',
          data: pluginDb.data,
        })
      }
    } else {
      await StorageService.INSTANCE.put({
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
