import { app, ipcMain, Menu } from 'electron'
import { MainWindow } from './windows/main'
import { SelectPartWindow } from './windows/selectPart'
import { isMacintosh } from '../common/platform'
import { getMainMenu } from './menus/main'

export class Application {
  public static instance = new Application()

  public mainWindow: MainWindow | undefined
  public selectPartWindow: SelectPartWindow | undefined

  public async start() {
    app.on('second-instance', () => {
      if (this.mainWindow?.win.isDestroyed()) return
      // Focus on the main window if the user tried to open another
      if (this.mainWindow?.win.isMinimized()) this.mainWindow.win.restore()
      this.mainWindow?.win.focus()
    })

    app.on('activate', () => {
      this.createAllWindow()
      // if (this.mainWindow?.win.isDestroyed()) {
      //   this.mainWindow = this.createMainWindow()
      // } else {
      //   this.mainWindow?.win.show()
      // }
      // if (this.selectPartWindow?.win.isDestroyed()) {
      //   this.selectPartWindow = this.createSelectPartWindow()
      // }
    })

    app.on('window-all-closed', () => {
      // On macOS it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      console.log('主线程：所有窗口关闭')
      if (!isMacintosh) app.quit()
    })

    ipcMain.on('close-main-window', () => {
      if (isMacintosh) {
        this.mainWindow?.win.close()
        this.selectPartWindow?.win.close()
      } else {
        app.quit()
      }
    })

    await app.whenReady()

    this.createAllWindow()

    Menu.setApplicationMenu(getMainMenu())
  }

  private getWindowID = () => {
    const windowID: Record<string, number> = {}
    if (this.mainWindow && !this.mainWindow.win.isDestroyed()) {
      windowID.mainWindow = this.mainWindow.id
    }
    if (this.selectPartWindow && !this.selectPartWindow.win.isDestroyed()) {
      windowID.selectPartWindow = this.selectPartWindow.id
    }
    return windowID
  }

  private sendWindowID = () => {
    const windowID = this.getWindowID()
    this.mainWindow?.send('windowID', windowID)
    this.selectPartWindow?.send('windowID', windowID)
  }

  private createAllWindow = () => {
    this.mainWindow = this.createMainWindow()
    this.selectPartWindow = this.createSelectPartWindow()
  }

  // 初始化主窗口
  private createMainWindow = () => {
    if (!this.mainWindow || this.mainWindow.win.isDestroyed()) {
      const mainWindow = new MainWindow()
      mainWindow.webContents.once('dom-ready', () => {
        this.sendWindowID()
      })
      return mainWindow
    }
    return this.mainWindow
  }

  // 初始化选分p窗口
  private createSelectPartWindow = () => {
    if (!this.selectPartWindow || this.selectPartWindow.win.isDestroyed()) {
      const selectPartWindow = new SelectPartWindow()
      selectPartWindow.webContents.once('dom-ready', () => {
        this.sendWindowID()
      })
      return selectPartWindow
    }
    return this.selectPartWindow
  }
}
