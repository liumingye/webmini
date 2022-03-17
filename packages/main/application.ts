import { app, BrowserWindow, Menu, session } from 'electron'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import is from 'electron-is'
import { join } from 'path'
import ipcMainInit from './ipcMain'
import { getMainMenu } from './menus/main'
import adblockerService from './services/adblocker'
import autoUpdaterService from './services/autoUpdater'
import { SessionsService } from './services/sessions'
import { MainWindow } from './windows/main'
import { SelectPartWindow } from './windows/selectPart'

export class Application {
  public static instance = new this()

  public static URL = is.dev()
    ? `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
    : `file://${join(app.getAppPath(), 'dist/renderer/index.html')}`

  public mainWindow: MainWindow | undefined
  public selectPartWindow: SelectPartWindow | undefined

  public start(): void {
    app.on('second-instance', () => {
      // Focus on the main window if the user tried to open another
      const win = this.mainWindow?.win
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

    // 服务
    adblockerService(session.defaultSession)
    autoUpdaterService()
    new SessionsService()

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
