import { app, ipcMain } from 'electron'
import { Application } from './application'
import is from 'electron-is'
import Plugins from './plugins'
import type { LocalPluginInfo } from '~/interfaces/plugin'
import { hookThemeColor } from './utils'

export default () => {
  // UI
  ipcMain.on('close-main-window', () => {
    if (is.macOS()) {
      Application.instance.mainWindow?.viewManager.clear()
      Application.instance.mainWindow?.win.close()
      Application.instance.selectPartWindow?.win.close()
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

  // 插件
  ipcMain.handle('get-local-plugins', () => {
    return Plugins.instance.getLocalPlugins()
  })
  ipcMain.handle('plugin-install', (e, plugin: LocalPluginInfo) => {
    return Plugins.instance.install(plugin)
  })
  ipcMain.handle('plugin-uninstall', async (e, plugin: LocalPluginInfo) => {
    return await Plugins.instance.uninstall(plugin)
  })

  ipcMain.on('ipc-init-complete', () => {
    hookThemeColor()
  })
}
