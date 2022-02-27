import { BrowserWindow, ipcMain } from 'electron'
import { enable } from '@electron/remote/main'
import { join } from 'path'
import { URL } from '../../common/utils'
import { MainWindow } from './main'

export class SelectPartWindow {
  public win: BrowserWindow

  private mainWindow: MainWindow

  public constructor(mainWindow: MainWindow) {
    this.mainWindow = mainWindow

    this.win = new BrowserWindow({
      show: false,
      width: 200,
      height: 300,
      frame: false,
      maximizable: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
      },
    })

    this.win.loadURL(`${URL}#/select-part`)

    enable(this.win.webContents)

    ipcMain.on('toggle-select-part-window', () => {
      this.toggle()
    })

    ipcMain.on('show-select-part-window', () => {
      this.show()
    })
  }

  public show() {
    if (this.win.isDestroyed()) return
    const p = this.mainWindow.win.getPosition(),
      s = this.win.getSize(),
      pos = [p[0] - s[0], p[1]]
    this.win.setPosition(pos[0], pos[1])
    this.win.show()
  }

  public hide() {
    this.win.hide()
  }

  public toggle() {
    if (this.win.isDestroyed()) return
    if (this.win.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }

  public get id() {
    return this.win.webContents.id
  }

  public get webContents() {
    return this.win.webContents
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args)
  }
}
