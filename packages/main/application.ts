import { app, ipcMain, Menu, BrowserWindow, session } from 'electron'
import is from 'electron-is'
import { join } from 'path'
import { MainWindow } from './windows/main'
import { SelectPartWindow } from './windows/selectPart'
import { getMainMenu } from './menus/main'
import adblockerService from './services/adblocker'
import autoUpdaterService from './services/autoUpdater'

export class Application {
  public static instance = new this()

  public static URL = is.dev()
    ? `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
    : `file://${join(app.getAppPath(), 'dist/renderer/index.html')}`

  public mainWindow: MainWindow | undefined
  public selectPartWindow: SelectPartWindow | undefined

  public async start() {
    app.on('second-instance', () => {
      if (this.mainWindow?.isDestroyed()) return
      // Focus on the main window if the user tried to open another
      if (this.mainWindow?.win.isMinimized()) this.mainWindow.win.restore()
      this.mainWindow?.win.focus()
    })

    app.on('activate', () => {
      this.createAllWindow()
    })

    app.on('window-all-closed', () => {
      // On macOS it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      console.log('主线程：所有窗口关闭')
      if (!is.macOS()) app.quit()
    })

    await app.whenReady()

    this.createAllWindow()
    Menu.setApplicationMenu(getMainMenu())

    ipcMain.on('close-main-window', () => {
      if (is.macOS()) {
        this.mainWindow?.win.close()
        this.selectPartWindow?.win.close()
      } else {
        app.quit()
      }
    })
    ipcMain.on('clearSensitiveDirectories', () => {
      this.clearSensitiveDirectories()
    })
    ipcMain.on('clearAllUserData', () => {
      this.clearAllUserData()
    })

    // 服务
    adblockerService(session.defaultSession)
    autoUpdaterService()
  }

  private getAllWindowID = () => {
    const windowID: Record<string, number> = {}
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      windowID.mainWindow = this.mainWindow.id
    }
    if (this.selectPartWindow && !this.selectPartWindow.isDestroyed()) {
      windowID.selectPartWindow = this.selectPartWindow.id
    }
    return windowID
  }

  private sendWindowID = () => {
    // console.debug('sendWindowID')
    const windowID = this.getAllWindowID()
    this.mainWindow?.send('windowID', windowID)
    this.selectPartWindow?.send('windowID', windowID)
  }

  private createAllWindow = () => {
    this.mainWindow = this.createMainWindow()
    this.selectPartWindow = this.createSelectPartWindow()
  }

  // 初始化主窗口
  private createMainWindow = () => {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      const mainWindow = new MainWindow()
      mainWindow.webContents.on('dom-ready', () => {
        this.sendWindowID()
      })
      return mainWindow
    }
    return this.mainWindow
  }

  // 初始化选分p窗口
  private createSelectPartWindow = () => {
    if (!this.selectPartWindow || this.selectPartWindow.isDestroyed()) {
      const selectPartWindow = new SelectPartWindow()
      selectPartWindow.webContents.on('dom-ready', () => {
        this.sendWindowID()
      })
      return selectPartWindow
    }
    return this.selectPartWindow
  }

  public relaunchApp = () => {
    const relaunchOptions = {
      execPath: process.execPath,
      args: process.argv,
    }
    /**
     * Fix for AppImage on Linux.
     */
    if (process.env.APPIMAGE) {
      relaunchOptions.execPath = process.env.APPIMAGE
      relaunchOptions.args.unshift('--appimage-extract-and-run')
    }
    app.relaunch(relaunchOptions)
    app.exit()
  }

  public getFocusedWindow = () => {
    return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  }

  public clearAllUserData = (): void => {
    const { webContents } = this.getFocusedWindow()
    webContents.session.flushStorageData()
    webContents.session.clearStorageData()
    this.relaunchApp()
  }

  /**
   * Removes directories containing leveldb databases.
   * Each directory is reinitialized after re-launching the application.
   */
  public clearSensitiveDirectories = (restart = true): void => {
    const { webContents } = this.getFocusedWindow()
    webContents.session.flushStorageData()
    webContents.session.clearStorageData({
      storages: ['appcache', 'cachestorage', 'serviceworkers', 'shadercache', 'indexdb', 'websql'],
    })
    if (restart) {
      this.relaunchApp()
    }
  }
}
