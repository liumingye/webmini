import { BrowserView, screen } from 'electron'
import { MainWindow } from './windows/main'
import { TabEvent, CreateProperties } from '~/interfaces/tabs'
import Plugins from './plugins'
import { registerAndGetData } from './plugins/data'
import { getHook } from './plugins/hook'
import { userAgent } from '~/common/constant'
import { matchPattern } from './utils'
import is from 'electron-is'
import { clamp } from 'lodash'
import Storage from 'electron-json-storage'
import { windowType } from '~/interfaces/view'

export class View {
  public windowType: windowType = 'mobile'

  public browserView: BrowserView

  private window: MainWindow

  private plugins: Plugins

  public bounds:
    | {
        x: number
        y: any
        width: number
        height: number
      }
    | undefined

  private url = ''

  private userAgent = userAgent.mobile

  private lastHostName = ''

  public constructor(window: MainWindow, details: CreateProperties) {
    this.browserView = new BrowserView({
      webPreferences: {
        //   preload: `${app.getAppPath()}/dist/inject/index.cjs`,
      },
    })
    this.browserView.webContents.loadURL('about:blank')

    this.window = window

    this.webContents.on('context-menu', (e, params) => {
      console.log(params)
      // todo 右键菜单
    })

    this.webContents.addListener('page-title-updated', (e, title) => {
      this.emitEvent('title-updated', title)
    })

    this.webContents.addListener('did-start-loading', () => {
      this.updateNavigationState()
      this.emitEvent('loading', true)
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-stop-loading', () => {
      this.updateNavigationState()
      this.emitEvent('loading', false)
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-navigate', async () => {
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-navigate-in-page', async () => {
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-start-navigation', async () => {
      this.updateNavigationState()
      this.updateURL(this.webContents.getURL())
    })

    // Make all links open with the browser, not with the application
    this.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http')) this.webContents.loadURL(url)
      return { action: 'deny' }
    })

    this.webContents.setUserAgent(userAgent.mobile)
    this.webContents.session.setUserAgent(userAgent.mobile)

    this.plugins = new Plugins(this.browserView.webContents)
    this.plugins.loadTabPlugins(details.url)

    this.webContents.loadURL(details.url, details.options)
    // register session
    this.session.webRequest.onBeforeSendHeaders((details, callback) => {
      // 禁止追踪
      details.requestHeaders['DNT'] = '1'

      // 根据插件配置设置浏览器UA
      if (details.resourceType === 'mainFrame' && details.url.startsWith('http')) {
        // 设置当前url 给resizeWindowSize使用 使用getUrl获取的不对
        this.url = details.url

        const url = new URL(this.url)

        const completeURL = url.hostname + url.pathname + url.search

        if (this.lastHostName !== url.hostname) {
          this.lastHostName = url.hostname
          this.plugins.unloadTabPlugins()
          this.plugins.loadTabPlugins(url.href)
        }

        type UA = {
          mobile: string[]
          desktop: string[]
        }

        const userAgentProvider = {
          mobile: [],
          desktop: [],
        }

        const [_userAgent]: UA[] = registerAndGetData('userAgent', userAgentProvider)

        // 桌面端
        if (_userAgent.desktop.some((value) => completeURL.includes(value))) {
          // console.log('dddddddd ' + completeURL)
          this.userAgent = userAgent.desktop
        }
        // 移动端
        else if (_userAgent.mobile.some((value) => completeURL.includes(value))) {
          // console.log('mmmmmmmmm ' + completeURL)
          this.userAgent = userAgent.mobile
        } else {
          this.userAgent = userAgent.desktop
        }

        details.requestHeaders['User-Agent'] = this.userAgent

        this.webContents.session.setUserAgent(this.userAgent)

        this.resizeWindowSize()
      }

      callback({ requestHeaders: details.requestHeaders })
    })

    // 体验不太好  用resize代替
    // this.browserView.setAutoResize({
    //   width: true,
    //   height: true,
    //   horizontal: false,
    //   vertical: false,
    // })
  }

  private lastUrl = ''

  public updateURL(url: string) {
    if (this.lastUrl === url) return
    this.lastUrl = url
    const updateUrlHooks = getHook('updateUrl')
    updateUrlHooks?.before({
      url,
    })
    this.emitEvent('title-updated', this.webContents.getTitle())
    this.webContents.setUserAgent(this.userAgent)
    this.webContents.send('load-commit')
    this.emitEvent('url-updated', url)
    updateUrlHooks?.after({
      url,
    })
  }

  public resizeWindowSize(windowType?: windowType) {
    const targetWindowType = windowType ? windowType : this.getWindowType()
    if (this.windowType === targetWindowType) return
    // We want the new window to open on the same display that the parent is in
    let displayToUse: Electron.Display | undefined
    const displays = screen.getAllDisplays()
    // Single Display
    if (displays.length === 1) {
      displayToUse = displays[0]
    }
    // Multi Display
    else {
      // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
      if (is.macOS()) {
        const cursorPoint = screen.getCursorScreenPoint()
        displayToUse = screen.getDisplayNearestPoint(cursorPoint)
      }
      // fallback to primary display or first display
      if (!displayToUse) {
        displayToUse = screen.getPrimaryDisplay() || displays[0]
      }
    }
    const displayBounds = displayToUse.bounds
    const currentSize = this.window.win.getSize()
    const leftTopPosition = this.window.win.getPosition()
    const rightBottomPosition = {
      x: leftTopPosition[0] + currentSize[0],
      y: leftTopPosition[1] + currentSize[1],
    }
    const config: any = Storage.getSync('config')
    const width = config['windowSize'][targetWindowType][0]
    const height = config['windowSize'][targetWindowType][1]
    const x = displayBounds.x + rightBottomPosition.x - width
    const y = displayBounds.y + rightBottomPosition.y - height
    const bounds: Required<Electron.Rectangle> = { width, height, x, y }
    // 防止超出屏幕可视范围
    bounds.x = clamp(bounds.x, displayBounds.x, displayBounds.width - bounds.width)
    bounds.y = clamp(bounds.y, displayBounds.y, displayBounds.height - bounds.height)
    this.window.win.setBounds(bounds, true)
    this.windowType = targetWindowType
    this.window.send('setCurrentWindowType', targetWindowType)
  }

  private getWindowType() {
    const _URL = new URL(this.url)
    const completeURL = _URL.hostname + _URL.pathname + _URL.search

    const windowTypeProvider = {
      mini: [],
    }
    const [windowType]: Record<string, (string | RegExp)[]>[] = registerAndGetData(
      'windowType',
      windowTypeProvider,
    )
    if (windowType.mini.some(matchPattern(completeURL))) {
      return 'mini'
    }
    // todo: 特殊大小窗口判断代码移动到插件内
    else if (completeURL.indexOf('passport.bilibili.com/login') >= 0) {
      return 'login'
    } else if (completeURL.indexOf('t.bilibili.com/?tab') >= 0) {
      return 'feed'
    } else if (this.webContents.session.getUserAgent() === userAgent.desktop) {
      return 'desktop'
    }
    return 'mobile'
  }

  public updateNavigationState() {
    if (this.browserView.webContents.isDestroyed()) return

    if (this.window.viewManager.selectedId === this.id) {
      this.window.send('updateNavigationState', {
        canGoBack: this.webContents.canGoBack(),
        canGoForward: this.webContents.canGoForward(),
      })
    }
  }

  public destroy() {
    // Cleanup.
    if (this.browserView) {
      // unregister session
      this.session.webRequest.onBeforeSendHeaders(null)
      ;(this.browserView.webContents as any).destroy()
      this.browserView = null as any
    }
  }

  public get session() {
    return this.webContents.session
  }

  public get webContents() {
    return this.browserView.webContents
  }

  public isDestroyed() {
    return this.browserView.webContents.isDestroyed()
  }

  public get id() {
    return this.webContents.id
  }

  public emitEvent(event: TabEvent, ...args: any[]) {
    this.window.send('tabEvent', event, this.id, args)
  }
}
