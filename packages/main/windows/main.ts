import { app, BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron'
import is from 'electron-is'
import { throttle } from 'lodash'
import { join } from 'path'
import { StorageService } from '../services/storage'
import { ViewManager } from '../viewManager'
import { CommonWindow } from './common'
import { Sessions } from '../models/sessions'
import { getUrl } from '../utils/getUrl'
import { WindowTypeEnum, WindowType, WindowTypeDefault } from '~/interfaces/view'

export class MainWindow extends CommonWindow {
  public viewManager: ViewManager

  private crossDomainSess: Sessions | undefined

  public constructor() {
    const window = new BrowserWindow({
      show: false,
      width: 300,
      height: 500,
      minHeight: 170,
      minWidth: 300,
      frame: false, // 是否有边框
      maximizable: false, // 加好 保存窗口大小 窗口位置 开启
      alwaysOnTop: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
      },
    })

    super(window)

    this.setBoundsFromDb().then(() => {
      this.show()
    })

    this.win.loadURL(getUrl('index', 'home'))

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

    /**
     * [mac] 下 setAutoResize 会有偏移
     * 这里关闭 setAutoResize 使用 fixBounds 手动改变大小
     */
    if (is.macOS()) {
      this.win.on('resize', () => {
        this.resizedThrottled()
      })
    }

    this.win.on('moved', () => {
      const windowType = this.viewManager.selected?.windowType || WindowTypeEnum.MOBILE
      if (windowType !== WindowTypeEnum.MOBILE) return

      // 获取
      const windowPosition = this.win.getPosition()

      // 写入
      StorageService.instance.put({
        _id: 'appDb',
        data: { windowPosition },
      })
    })

    this.win.on('resized', async () => {
      // 保存窗口大小
      const isMaximized = this.win.isMaximized()
      const isFullScreen = this.win.isFullScreen()
      if (isMaximized || isFullScreen) return

      const appDb = await StorageService.instance.get('appDb')

      // 查询
      const windowSize: WindowType = appDb?.data.windowSize || WindowTypeDefault
      const windowType = this.viewManager.selected?.windowType || WindowTypeEnum.MOBILE

      // 获取
      windowSize[windowType] = this.win.getSize()

      // 写入
      StorageService.instance.put({
        _id: 'appDb',
        data: { windowSize },
      })

      // 保存一下窗口位置
      setTimeout(() => {
        this.win.emit('moved')
      }, 15)
    })
  }

  private resizedThrottled = throttle(() => {
    this.viewManager.fixBounds()
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
        bound.width = appDb.data.windowSize[WindowTypeEnum.MOBILE][0]
        bound.height = appDb.data.windowSize[WindowTypeEnum.MOBILE][1]
      }
      this.win.setBounds(bound)
    }
  }

  private eventDomReady() {
    // 处理跨域
    this.crossDomainSess = new Sessions(this.session, [
      'https://gitee.com/liumingye/webmini-database/raw/master/*',
    ])
    this.crossDomainSess.register('onBeforeSendHeaders', (details) => {
      if (details.resourceType === 'xhr' && details.requestHeaders) {
        details.requestHeaders['Referer'] = 'https://gitee.com'
        return { requestHeaders: details.requestHeaders }
      }
    })
    this.crossDomainSess.register('onHeadersReceived', (details) => {
      if (details.resourceType === 'xhr' && details.responseHeaders) {
        details.responseHeaders['Access-Control-Allow-Origin'] = ['*']
        return { responseHeaders: details.responseHeaders }
      }
    })
  }

  private eventClose() {
    this.crossDomainSess?.destroy()
    this.viewManager.clearViewContainer()
    if (!is.macOS()) {
      process.nextTick(() => {
        app.quit()
      })
    }
  }
}
