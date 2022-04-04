import { app, ipcMain } from 'electron'
import is from 'electron-is'
import type { AdapterInfo, PluginMinimalData } from '~/interfaces/plugin'
import { Application } from './application'
import { Plugin } from './core/plugin'
import { hookThemeColor } from './utils'
import { StorageService } from './services/storage'

export default () => {
  // UI
  ipcMain.on('close-main-window', () => {
    if (is.macOS()) {
      if (Application.INSTANCE.mainWindow) {
        Application.INSTANCE.mainWindow.viewManager.clearViewContainer()
        Application.INSTANCE.mainWindow.win.close()
        Application.INSTANCE.mainWindow = undefined
      }
      if (Application.INSTANCE.selectPartWindow) {
        Application.INSTANCE.selectPartWindow.win.close()
        Application.INSTANCE.selectPartWindow = undefined
      }
    } else {
      app.quit()
    }
  })

  // 设置
  ipcMain.on('clear-sensitive-directories', () => {
    Application.INSTANCE.clearSensitiveDirectories()
  })
  ipcMain.on('clear-all-user-data', () => {
    Application.INSTANCE.clearAllUserData()
  })

  // plugin 插件
  ipcMain.handle('get-local-plugins', async () => {
    return await Plugin.INSTANCE.getLocalPlugins()
  })
  ipcMain.handle('plugin-install', async (e, plugin: AdapterInfo) => {
    return await Plugin.INSTANCE.install(plugin)
  })
  ipcMain.handle('plugin-uninstall', async (e, plugin: AdapterInfo) => {
    return await Plugin.INSTANCE.uninstall(plugin)
  })
  ipcMain.handle('plugin-get-data', async (e, name: string, key: keyof PluginMinimalData) => {
    const plugin = Plugin.INSTANCE.allPlugins.find((plugin) => plugin.name === name)
    if (!plugin) return
    return plugin[key]
  })

  // db 数据库
  ipcMain.handle('db-put', async (e, data, key?) => {
    return await StorageService.INSTANCE.put(data, key)
  })
  ipcMain.handle('db-get', async (e, id, key?) => {
    return await StorageService.INSTANCE.get(id, key)
  })

  // renderer ipc注册完成
  ipcMain.on('ipc-init-complete', () => {
    hookThemeColor()
  })
}
