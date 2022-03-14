import { PluginMetadata, PluginStatus } from '~/interfaces/plugin'
import { app } from 'electron'
import AdapterHandler from './handler'
import { join, resolve } from 'path'
import fs from 'fs'
import { StorageService } from '../services/storage'

const baseDir = join(app.getPath('userData'), './plugins')

interface pluginInfo {
  name: string
}

class Plugins {
  public static instance = new this()

  public allPlugins: PluginMetadata[]

  public enablePlugins: PluginMetadata[] = []

  public handler: AdapterHandler

  public constructor() {
    this.allPlugins = []

    this.handler = new AdapterHandler({
      baseDir,
    })

    const plugin: pluginInfo = {
      name: 'webmini-bilibili',
    }
    const pluginPath = resolve(baseDir, 'node_modules', plugin.name)
    const pluginInfo = JSON.parse(fs.readFileSync(join(pluginPath, './package.json'), 'utf8'))
    const _load = import(resolve(pluginPath, pluginInfo.main))
    _load.then((res) => {
      this.allPlugins.push(res.plugin)
    })
    console.log(this.getLocalPlugins())
  }

  public getLocalPlugins() {
    return StorageService.instance.get('plugin')
  }

  public async install(plugin: pluginInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.INSTALLING }, 'plugin')
    await this.handler.install([plugin.name], { isDev: false })
    StorageService.instance.update({ [plugin.name]: PluginStatus.COMPLETE }, 'plugin')
  }

  public async uninstall(plugin: pluginInfo) {
    StorageService.instance.update({ [plugin.name]: PluginStatus.UNINSTALLING }, 'plugin')
    await this.handler.uninstall([plugin.name], { isDev: false })
    StorageService.instance.remove(plugin.name, 'plugin')
  }
}

export default Plugins
