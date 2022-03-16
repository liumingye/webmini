import type { PluginMetadata, LocalPluginInfo } from '~/interfaces/plugin'
import { PluginStatus } from '~/interfaces/plugin'
import { app } from 'electron'
import AdapterHandler from './handler'
import { join, resolve } from 'path'
import fs from 'fs'
import { StorageService } from '../services/storage'
import Logger from '~/common/logger'
import { Application } from '../application'
import { isValidKey } from '~/common/object'

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
    localPlugins.forEach((p) => {
      this.addPlugin(p)
    })
  }

  /**
   * 添加插件
   * @param plugin
   * @returns
   */
  public async addPlugin(plugin: LocalPluginInfo) {
    try {
      const pluginPath = this.getPluginPath(plugin.name)
      const pluginInfo = JSON.parse(fs.readFileSync(join(pluginPath, './package.json'), 'utf8'))
      const module = import(resolve(pluginPath, pluginInfo.main))
      module.then((res) => {
        this.allPlugins.push(res.plugin)
        return res.plugin
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
  public async deletePlugin(plugin: LocalPluginInfo) {
    this.allPlugins = this.allPlugins.filter((p) => plugin.name !== p.name)
    return this.allPlugins
  }

  /**
   * 获取本地插件
   * @returns
   */
  public getLocalPlugins(): LocalPluginInfo[] {
    const allPlugins = StorageService.instance.get('plugin')
    return Object.keys(allPlugins)
      .map((name) => {
        try {
          const pluginPath = this.getPluginPath(name)
          const pluginInfo = JSON.parse(fs.readFileSync(join(pluginPath, './package.json'), 'utf8'))
          if (isValidKey(name, allPlugins)) {
            return Object.assign(pluginInfo, { status: allPlugins[name] })
          }
        } catch (error) {
          //
        }
      })
      .filter((it) => it !== undefined)
  }

  /**
   * 获取插件路径
   * @param plugin
   * @returns
   */
  public getPluginPath(name: string) {
    return resolve(this.baseDir, 'node_modules', name)
  }

  /**
   * 安装插件
   * @param plugin
   * @returns
   */
  public async install(plugin: LocalPluginInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.INSTALLING }, 'plugin')
    Logger.info(`开始安装 - ${plugin.name}`)
    Application.instance.mainWindow?.send('plugin-status-update', plugin, PluginStatus.INSTALLING)

    await this.handler.install([plugin.name])

    const pluginPath = this.getPluginPath(plugin.name)

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
  public async uninstall(plugin: LocalPluginInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.UNINSTALLING }, 'plugin')
    Logger.info(`开始卸载 - ${plugin.name}`)
    Application.instance.mainWindow?.send('plugin-status-update', plugin, PluginStatus.UNINSTALLING)

    await this.handler.uninstall([plugin.name])

    const pluginPath = this.getPluginPath(plugin.name)

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
