import { app, BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron'
import is from 'electron-is'
import { throttle } from 'lodash'
import { join } from 'path'
import { StorageService } from '../services/storage'
import { ViewManager } from '../viewManager'
import { CommonWindow } from './common'
import { Sessions } from '../models/sessions'
import { getUrl } from '../utils/getUrl'

export class MainWindow extends CommonWindow {
  public viewManager: ViewManager

  private sess: Sessions | undefined

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

    this.win.on('resized', () => {
      // const [width, height] = this.win.getSize()
      // const isMaximized = this.win.isMaximized()
      // const isFullScreen = this.win.isFullScreen()
      // if (isMaximized || isFullScreen) return
      // todo 保存窗口大小 窗口位置
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
