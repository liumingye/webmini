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

export class Plugin {
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
    this.getLocalPlugins().then((localPlugins) => {
      localPlugins.forEach((p) => {
        this.addPlugin(p.name)
      })
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
   * @param plugin
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

    const oldDb = await StorageService.instance.get('pluginDb')

    if (status === PluginStatus.UNINSTALL_FAIL) {
      status = PluginStatus.INSTALLING_COMPLETE
    }

    const newDb = oldDb ? { ...oldDb.data, [plugin.name]: status } : { [plugin.name]: status }

    if ([PluginStatus.INSTALL_FAIL, PluginStatus.UNINSTALL_COMPLETE].includes(status)) {
      delete newDb[plugin.name]
    }

    await StorageService.instance.put({
      _id: 'pluginDb',
      data: newDb,
    })
  }

  /**
   * 安装插件
   * @param plugin
   * @returns
   */
  public async install(plugin: AdapterInfo) {
    Logger.info(`开始安装 - ${plugin.name}`)
    this.updateStatus(plugin, PluginStatus.INSTALLING)

    await this.handler.install([`${plugin.name}@${plugin.version}`])

    const pluginPath = this.getPluginPath(plugin.name)

    // 安装失败
    if (!fs.existsSync(pluginPath)) {
      Logger.info(`安装失败 - ${plugin.name}`)
      this.updateStatus(plugin, PluginStatus.INSTALL_FAIL)

      return false
    }

    // 安装成功
    Logger.info(`安装成功 - ${plugin.name}`)
    this.updateStatus(plugin, PluginStatus.INSTALLING_COMPLETE)

    this.addPlugin(plugin.name)

    return true
  }

  /**
   * 卸载插件
   * @param plugin
   * @returns
   */
  public async uninstall(plugin: AdapterInfo) {
    Logger.info(`开始卸载 - ${plugin.name}`)
    this.updateStatus(plugin, PluginStatus.UNINSTALLING)

    await this.handler.uninstall([plugin.name])

    const pluginPath = this.getPluginPath(plugin.name)

    // 卸载失败
    if (fs.existsSync(pluginPath)) {
      Logger.info(`卸载失败 - ${plugin.name}`)
      this.updateStatus(plugin, PluginStatus.UNINSTALL_FAIL)

      return false
    }

    // 卸载成功
    Logger.info(`卸载成功 - ${plugin.name}`)
    this.updateStatus(plugin, PluginStatus.UNINSTALL_COMPLETE)

    this.deletePlugin(plugin.name)

    return true
  }
}
