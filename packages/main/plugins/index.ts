import type { PluginMetadata, AdapterInfo } from '~/interfaces/plugin'
import { PluginStatus } from '~/interfaces/plugin'
import { app } from 'electron'
import AdapterHandler from './handler'
import { join, resolve } from 'path'
import fs from 'fs'
import { StorageService } from '../services/storage'
import Logger from '~/common/logger'
import { Application } from '../application'

class Plugins {
  public static instance = new this()

  public baseDir = join(app.getPath('userData'), './plugins')

  public allPlugins: PluginMetadata[]

  public enablePlugins: PluginMetadata[] = []

  public handler: AdapterHandler

  public constructor() {
    this.allPlugins = []

    this.handler = new AdapterHandler({
      baseDir: this.baseDir,
    })

    //  加载本地插件
    const localPlugins = this.getLocalPlugins()
    const localPluginsName = Object.keys(localPlugins)
    localPluginsName.forEach((name) => {
      const plugin = {
        name,
      } as AdapterInfo
      this.addPlugin(plugin)
    })
  }

  /**
   * 添加插件
   * @param plugin
   * @returns
   */
  public async addPlugin(plugin: AdapterInfo) {
    try {
      const pluginPath = this.getPluginPath({ name: plugin.name } as AdapterInfo)
      const pluginInfo = JSON.parse(fs.readFileSync(join(pluginPath, './package.json'), 'utf8'))
      const _load = import(resolve(pluginPath, pluginInfo.main))
      _load.then((res) => {
        this.allPlugins.push(res.plugin)
        return this.allPlugins
      })
    } catch (error) {
      Logger.error(error)
      return false
    }
  }

  /**
   * 删除插件
   * @param plugin
   * @returns
   */
  public async deletePlugin(plugin: AdapterInfo) {
    this.allPlugins = this.allPlugins.filter((p) => plugin.name !== p.name)
    return this.allPlugins
  }

  /**
   * 获取本地插件
   * @returns
   */
  public getLocalPlugins() {
    return StorageService.instance.get('plugin')
  }

  /**
   * 获取插件路径
   * @param plugin
   * @returns
   */
  public getPluginPath(plugin: AdapterInfo) {
    return resolve(this.baseDir, 'node_modules', plugin.name)
  }

  /**
   * 安装插件
   * @param plugin
   * @returns
   */
  public async install(plugin: AdapterInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.INSTALLING }, 'plugin')
    Logger.info(`开始安装 - ${plugin.name}`)
    Application.instance.mainWindow?.send('plugin-status-update', plugin, PluginStatus.INSTALLING)

    await this.handler.install([plugin.name])

    const pluginPath = this.getPluginPath({ name: plugin.name } as AdapterInfo)

    // 安装失败
    if (!fs.existsSync(pluginPath)) {
      StorageService.instance.remove(plugin.name, 'plugin')
      Logger.info(`安装失败 - ${plugin.name}`)
      Application.instance.mainWindow?.send(
        'plugin-status-update',
        plugin,
        PluginStatus.INSTALL_FAIL,
      )
      return false
    }

    // 安装成功
    StorageService.instance.update({ [plugin.name]: PluginStatus.INSTALLING_COMPLETE }, 'plugin')
    Logger.info(`安装成功 - ${plugin.name}`)
    Application.instance.mainWindow?.send(
      'plugin-status-update',
      plugin,
      PluginStatus.INSTALLING_COMPLETE,
    )

    this.addPlugin(plugin)

    return true
  }

  /**
   * 卸载插件
   * @param plugin
   * @returns
   */
  public async uninstall(plugin: AdapterInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.UNINSTALLING }, 'plugin')
    Logger.info(`开始卸载 - ${plugin.name}`)
    Application.instance.mainWindow?.send('plugin-status-update', plugin, PluginStatus.UNINSTALLING)

    await this.handler.uninstall([plugin.name])

    const pluginPath = this.getPluginPath({ name: plugin.name } as AdapterInfo)

    // 卸载失败
    if (fs.existsSync(pluginPath)) {
      StorageService.instance.update({ [plugin.name]: PluginStatus.INSTALLING }, 'plugin')
      Logger.info(`卸载失败 - ${plugin.name}`)
      Application.instance.mainWindow?.send(
        'plugin-status-update',
        plugin,
        PluginStatus.UNINSTALL_FAIL,
      )

      return false
    }

    // 卸载成功
    StorageService.instance.remove(plugin.name, 'plugin')
    Logger.info(`卸载成功 - ${plugin.name}`)
    Application.instance.mainWindow?.send(
      'plugin-status-update',
      plugin,
      PluginStatus.UNINSTALL_COMPLETE,
    )

    this.deletePlugin(plugin)

    return true
  }
}

export default Plugins
