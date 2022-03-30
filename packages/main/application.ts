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
    app.on('window-all-closed', this.onWindowAllClosed.bind(this))
    app.on('second-instance', this.onSecondInstance.bind(this))
    app.on('activate', this.onActivate.bind(this))
    app.on('ready', this.onReady.bind(this))
  }

  private onActivate() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    this.createAllWindow()
  }

  private onSecondInstance() {
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
  }

  private onWindowAllClosed() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!is.macOS()) app.quit()
  }

  private onReady() {
    // todo 设置添加主题
    // nativeTheme.themeSource = 'system'

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

  private getAllWindowID() {
    const winIDs = []
    if (this.mainWindow) winIDs.push(this.mainWindow.win.id)
    if (this.selectPartWindow) winIDs.push(this.selectPartWindow.win.id)
    return winIDs
  }

  private sendWindowID() {
    const windowID = this.getAllWindowID()
    this.mainWindow?.send('windowID', windowID)
    this.selectPartWindow?.send('windowID', windowID)
  }

  private createAllWindow() {
    this.mainWindow = this.createMainWindow()
    this.selectPartWindow = this.createSelectPartWindow()
  }

  // 初始化主窗口
  private createMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      const mainWindow = new MainWindow()
      mainWindow.webContents.on('dom-ready', this.sendWindowID.bind(this))
      return mainWindow
    }
    return this.mainWindow
  }

  // 初始化选分p窗口
  private createSelectPartWindow() {
    if (!this.selectPartWindow || this.selectPartWindow.isDestroyed()) {
      const selectPartWindow = new SelectPartWindow()
      selectPartWindow.webContents.on('dom-ready', this.sendWindowID.bind(this))
      return selectPartWindow
    }
    return this.selectPartWindow
  }

  public relaunchApp(): void {
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

  public getFocusedWindow(): BrowserWindow | undefined {
    const win = BrowserWindow.getFocusedWindow()
    if (win) return win
    return undefined
  }

  public async clearAllUserData(): Promise<void> {
    const focusedWindow = this.getFocusedWindow()
    if (!focusedWindow) return
    const answer = dialog.showMessageBoxSync(focusedWindow, {
      type: 'question',
      title: '确认',
      message: `确认重置应用?`,
      detail: `你的浏览器数据将被清空，包括缓存、本地存储、登录状态`,
      buttons: ['确认', '取消'],
    })

    if (answer === 1) {
      return
    }

    const { webContents } = focusedWindow
    webContents.session.flushStorageData()

    await Promise.all([
      webContents.session.clearCache(),
      webContents.session.clearStorageData(),
      // ...
    ])

    this.relaunchApp()
  }

  /**
   * Removes directories containing leveldb databases.
   * Each directory is reinitialized after re-launching the application.
   */
  public async clearSensitiveDirectories(restart = false): Promise<void> {
    const focusedWindow = this.getFocusedWindow()
    if (!focusedWindow) return
    const { webContents } = focusedWindow
    webContents.session.flushStorageData()

    await Promise.all([
      webContents.session.clearCache(),
      webContents.session.clearStorageData({
        storages: [
          'appcache',
          'cachestorage',
          'serviceworkers',
          'shadercache',
          'indexdb',
          'websql',
        ],
      }),
    ])

    if (restart) {
      this.relaunchApp()
      return
    }

    dialog.showMessageBoxSync(focusedWindow, {
      type: 'info',
      title: `提示`,
      message: `清除完成`,
      buttons: ['好的'],
    })
  }
}
