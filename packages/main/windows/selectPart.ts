import { BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { Application } from '../application'
import { CommonWindow } from './common'
import { getDisplayBounds } from '../utils'
import { getUrl } from '../utils/getUrl'

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

    super(window)

    this.win.loadURL(getUrl('index', 'select-part'))

    ipcMain.on('toggle-select-part-window', () => {
      this.toggle()
    })

    ipcMain.on('show-select-part-window', () => {
      this.show()
    })
  }

  public show(): void {
    const mainWindow = Application.instance.mainWindow

    if (this.isDestroyed() || !mainWindow) return

    const mainPos = mainWindow.win.getPosition()
    const selectPartSize = this.win.getSize()

    // 默认显示在窗口左面
    // the default display in the window on the left
    let x: number = mainPos[0] - selectPartSize[0]
    const y: number = mainPos[1]

    // 超出显示器 显示在窗口右面
    // beyond the display in the window is on the right
    if (x < getDisplayBounds().x) {
      const mainSize = mainWindow.win.getSize()
      x = mainPos[0] + mainSize[0]
    }

    this.win.setPosition(x, y)
    this.win.show()
  }
}
