import type { PluginMetadata, LocalPluginInfo, AdapterInfo } from '~/interfaces/plugin'
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
      this.addPlugin(p.name)
    })
  }

  /**
   * 添加插件
   * @param plugin
   * @returns
   */
  public async addPlugin(name: string) {
    try {
      const pluginPath = this.getPluginPath(name)
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
  public async deletePlugin(name: string) {
    this.allPlugins = this.allPlugins.filter((p) => name !== p.name)
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
          if (
            isValidKey(name, allPlugins) &&
            allPlugins[name] === PluginStatus.INSTALLING_COMPLETE
          ) {
            const pluginPath = this.getPluginPath(name)
            const pluginInfo = JSON.parse(
              fs.readFileSync(join(pluginPath, './package.json'), 'utf8'),
            )
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
  public async install(plugin: AdapterInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.INSTALLING }, 'plugin')
    Logger.info(`开始安装 - ${plugin.name}`)
    Application.instance.mainWindow?.send('plugin-status-update', plugin, PluginStatus.INSTALLING)

    await this.handler.install([`${plugin.name}@${plugin.version}`])

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

    this.addPlugin(plugin.name)

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

    this.deletePlugin(plugin.name)

    return true
  }
}

export default Plugins
