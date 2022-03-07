import { CommonWindow } from './common'
import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { Application } from '../application'

export class SelectPartWindow extends CommonWindow {
  public constructor() {
    const window = new BrowserWindow({
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

    window.loadURL(`${Application.URL}#/select-part`)

    ipcMain.on('toggle-select-part-window', () => {
      this.toggle()
    })

    ipcMain.on('show-select-part-window', () => {
      this.show()
    })

    super(window)
  }

  public show() {
    if (this.isDestroyed() || !Application.instance.mainWindow) return
    const p = Application.instance.mainWindow.win.getPosition(),
      s = this.win.getSize(),
      pos = [p[0] - s[0], p[1]]
    this.win.setPosition(pos[0], pos[1])
    this.win.show()
  }
}
