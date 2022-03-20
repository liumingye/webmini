import { app, BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron'
import is from 'electron-is'
import { throttle } from 'lodash'
import { join } from 'path'
import { Application } from '../application'
import { StorageService } from '../services/storage'
import { ViewManager } from '../viewManager'
import { CommonWindow } from './common'
import { Sessions } from '../models/sessions'

export class MainWindow extends CommonWindow {
  public viewManager: ViewManager

  public sess: Sessions | undefined

  private isMoving = false

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

    this.setBoundsFromDb().then(() => {
      this.show()
    })

    this.win.loadURL(`${Application.URL}#/home`)

    this.viewManager = new ViewManager(this)

    // Make all links open with the browser, not with the application
    this.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    this.webContents.on('dom-ready', () => {
      this.eventDomReady()
    })

    this.win.on('close', () => {
      this.eventClose()
    })

    this.win.on('resize', () => {
      this.resizedThrottled()
    })

    this.win.on('move', () => {
      this.isMoving = true
    })

    this.win.on('moved', () => {
      this.isMoving = false
    })
  }

  private resizedThrottled = throttle(() => {
    //在 windows，移动窗口也会触发 resize，这里做一下判断
    if (!this.win.isMaximized() && !this.isMoving) {
      console.log('resizedThrottled')
      this.viewManager.fixBounds()
    }
  }, 150)

  private async setBoundsFromDb() {
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
      this.win.setBounds(bound)
    }
  }

  private eventDomReady() {
    // 处理跨域
    this.sess = new Sessions(this.session)
    this.sess.register('onHeadersReceived', (details) => {
      if (details.resourceType === 'xhr' && details.responseHeaders) {
        details.responseHeaders['Access-Control-Allow-Origin'] = ['*']
      }
      return { responseHeaders: details.responseHeaders }
    })
  }

  private eventClose() {
    this.sess?.destroy()
    this.viewManager.clearViewContainer()
    if (!is.macOS()) {
      process.nextTick(() => {
        app.quit()
      })
    }
  }
}
