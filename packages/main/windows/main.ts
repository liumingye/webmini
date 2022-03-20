import { app, BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron'
import is from 'electron-is'
import { throttle } from 'lodash'
import { join } from 'path'
import { Application } from '../application'
import { StorageService } from '../services/storage'
import { ViewManager } from '../viewManager'
import { CommonWindow } from './common'

export class MainWindow extends CommonWindow {
  public viewManager: ViewManager

  public constructor() {
    const window = new BrowserWindow({
      show: false,
      width: 300,
      height: 500,
      minHeight: 170,
      minWidth: 300,
      frame: false, // 是否有边框
      maximizable: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
      },
    })

    super(window)

    this.setBound()

    this.win.loadURL(`${Application.URL}#/home`)

    this.viewManager = new ViewManager(this)

    // Make all links open with the browser, not with the application
    this.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    this.win.on('close', () => {
      this.eventClose()
    })

    const resizedThrottled = throttle(() => {
      if (!this.win.isMaximized()) {
        this.viewManager.fixBounds()
      }
    }, 150)

    // setAutoResize 会有偏移bug 窗口大小改变后 修复一下
    this.win.on('resized', () => {
      resizedThrottled()
    })

    this.webContents.on('dom-ready', () => {
      this.eventDomReady()
    })
  }

  private async setBound() {
    const appDb = await StorageService.instance.get('appDb')
    const bound: BrowserWindowConstructorOptions = {}
    if (appDb) {
      if (appDb.data.windowPosition) {
        bound.x = appDb.data.windowPosition[0]
        bound.y = appDb.data.windowPosition[1]
      }
      if (appDb.data.windowSize) {
        bound.width = appDb.data.windowSize['mobile'][0]
        bound.height = appDb.data.windowSize['mobile'][1]
      }
    }
    this.win.setBounds(bound)
    this.show()
  }

  private eventDomReady() {
    // 处理跨域
    this.session.webRequest.onHeadersReceived((details, callback) => {
      if (
        details.resourceType === 'xhr' &&
        details.url.startsWith('https://gitee.com/liumingye/') &&
        details.responseHeaders
      ) {
        details.responseHeaders['Access-Control-Allow-Origin'] = ['*']
      }
      callback({ responseHeaders: details.responseHeaders })
    })
  }

  private eventClose() {
    this.session.webRequest.onHeadersReceived(null)
    this.viewManager.clear()
    if (!is.macOS()) {
      process.nextTick(() => {
        app.quit()
      })
    }
  }
}
