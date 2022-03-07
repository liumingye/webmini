import { CommonWindow } from './common'
import { BrowserWindow, app, shell } from 'electron'
import is from 'electron-is'
import { join } from 'path'
import Storage from 'electron-json-storage'
import { Application } from '../application'
import { ViewManager } from '../viewManager'
import { throttle } from 'lodash-es'

export class MainWindow extends CommonWindow {
  public viewManager: ViewManager

  public constructor(window?: BrowserWindow) {
    const bound: Record<string, number> = {}

    const config: any = Storage.getSync('config')

    const windowPosition = config['windowPosition']
    if (windowPosition) {
      bound.x = windowPosition[0]
      bound.y = windowPosition[1]
    }

    const windowSize = config['windowSize']
    if (windowSize && windowSize['mobile']) {
      bound.width = windowSize['mobile'][0]
      bound.height = windowSize['mobile'][1]
    } else {
      bound.width = 376
      bound.height = 500
    }

    window = new BrowserWindow({
      ...bound,
      // opacity: 0.5,
      minHeight: 170,
      minWidth: 300,
      frame: false, // 是否有边框
      maximizable: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
        // nativeWindowOpen: false,
      },
    })

    super(window)

    window.loadURL(Application.URL)

    this.viewManager = new ViewManager(this)

    // Make all links open with the browser, not with the application
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    window.on('close', () => {
      if (!this.isDestroyed()) this.viewManager.clear()
      if (!is.macOS()) {
        process.nextTick(() => {
          app.quit()
        })
      }
    })

    const throttled = throttle(() => {
      if (!this.win.isMaximized()) {
        this.viewManager.fixBounds()
      }
    }, 150)

    this.win.on('resize', () => {
      throttled()
    })
  }
}
