import { CommonWindow } from './common'
import { BrowserWindow, app, shell, BrowserWindowConstructorOptions } from 'electron'
import is from 'electron-is'
import { join } from 'path'
import { Application } from '../application'
import { ViewManager } from '../viewManager'
import { throttle } from 'lodash'
import { StorageService } from '../services/storage'

export class MainWindow extends CommonWindow {
  public viewManager: ViewManager

  public constructor() {
    const bound: BrowserWindowConstructorOptions = {}

    const windowPosition = StorageService.instance.find('windowPosition')
    const windowSize = StorageService.instance.find('windowSize')

    if (windowPosition) {
      bound.x = windowPosition[0]
      bound.y = windowPosition[1]
    }

    if (windowSize && windowSize['mobile']) {
      bound.width = windowSize['mobile'][0]
      bound.height = windowSize['mobile'][1]
    } else {
      bound.width = 376
      bound.height = 500
    }

    const window = new BrowserWindow({
      ...bound,
      // transparent: true,
      minHeight: 170,
      minWidth: 300,
      frame: false, // 是否有边框
      maximizable: false,
      alwaysOnTop: true,
      webPreferences: {
        webSecurity: false,
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
      this.viewManager.clear()
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
