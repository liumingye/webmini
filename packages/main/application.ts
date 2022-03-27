import { app, BrowserWindow, Menu, session, dialog } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import is from 'electron-is'
import ipcMainInit from './ipcMain'
import { getMainMenu } from './menus/main'
import adblockerService from './services/adblocker'
import autoUpdaterService from './services/autoUpdater'
import { MainWindow } from './windows/main'
import { SelectPartWindow } from './windows/selectPart'
import { registerProtocol } from './models/protocol'

export class Application {
  public static instance = new this()

  public mainWindow: MainWindow | undefined

  public selectPartWindow: SelectPartWindow | undefined

  public start(): void {
    app.on('second-instance', () => {
      // Focus on the main window if the user tried to open another
      if (!this.mainWindow) return
      const win = this.mainWindow.win
      if (win) {
        if (win.isDestroyed()) {
          return this.createAllWindow()
        }
        if (win.isMinimized()) {
          win.restore()
        }
        win.focus()
      }
    })

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      this.createAllWindow()
    })

    app.on('window-all-closed', () => {
      // On macOS it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (!is.macOS()) app.quit()
    })

    this.onReady()
  }

  private async onReady() {
    await app.whenReady()

    this.createAllWindow()

    Menu.setApplicationMenu(getMainMenu())

    ipcMainInit()

    // service
    adblockerService(session.defaultSession)
    autoUpdaterService()

    // protocol
    registerProtocol(session.defaultSession)

    // vue-devtools
    if (is.dev()) {
      installExtension(VUEJS3_DEVTOOLS.id, {
        loadExtensionOptions: { allowFileAccess: true },
      })
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err))
    }
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

  public relaunchApp = (): void => {
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
    const focusedWindow = this.getFocusedWindow()
    const answer = dialog.showMessageBoxSync(focusedWindow, {
      type: 'question',
      title: `确认重置应用?`,
      message: `确认重置应用?`,
      detail: `你的浏览器数据将被清空，包括缓存、本地存储、登录状态`,
      buttons: ['确认', '取消'],
    })

    if (answer === 1) {
      return
    }

    const { webContents } = focusedWindow
    webContents.session.flushStorageData()
    webContents.session.clearCache()
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
    webContents.session.clearCache()
    webContents.session.clearStorageData({
      storages: ['appcache', 'cachestorage', 'serviceworkers', 'shadercache', 'indexdb', 'websql'],
    })
    if (restart) {
      this.relaunchApp()
    }
  }
}
