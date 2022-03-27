import { app, ipcMain } from 'electron'
import is from 'electron-is'
import type { AdapterInfo } from '~/interfaces/plugin'
import { Application } from './application'
import { Plugin } from './core/plugin'
import { getData } from './core/plugin/data'
import { hookThemeColor } from './utils'
import { StorageService } from './services/storage'

export default () => {
  // UI
  ipcMain.on('close-main-window', () => {
    if (is.macOS()) {
      if (Application.instance.mainWindow) {
        Application.instance.mainWindow.viewManager.clearViewContainer()
        Application.instance.mainWindow.win.close()
        Application.instance.mainWindow = undefined
      }
      if (Application.instance.selectPartWindow) {
        Application.instance.selectPartWindow.win.close()
        Application.instance.selectPartWindow = undefined
      }
    } else {
      app.quit()
    }
  })

  // 设置
  ipcMain.on('clear-sensitive-directories', () => {
    Application.instance.clearSensitiveDirectories()
  })
  ipcMain.on('clear-all-user-data', () => {
    Application.instance.clearAllUserData()
  })

  // plugin 插件
  ipcMain.handle('get-local-plugins', async () => {
    return await Plugin.instance.getLocalPlugins()
  })
  ipcMain.handle('plugin-install', async (e, plugin: AdapterInfo) => {
    return await Plugin.instance.install(plugin)
  })
  ipcMain.handle('plugin-uninstall', async (e, plugin: AdapterInfo) => {
    return await Plugin.instance.uninstall(plugin)
  })
  ipcMain.handle('plugin-get-data', async (e, name: string, key: string) => {
    return getData(name, key)
  })

  // db 数据库
  ipcMain.handle('db-put', async (e, data, key?) => {
    return await StorageService.instance.put(data, key)
  })
  ipcMain.handle('db-get', async (e, id, key?) => {
    return await StorageService.instance.get(id, key)
  })

  // renderer ipc注册完成
  ipcMain.on('ipc-init-complete', () => {
    hookThemeColor()
  })
}
