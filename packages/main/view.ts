import { app, BrowserView, screen } from 'electron'
import is from 'electron-is'
import { clamp } from 'lodash'
import { ERROR_PROTOCOL, NETWORK_ERROR_HOST, userAgent } from '~/common/constant'
import type { CreateProperties, TabEvent } from '~/interfaces/tabs'
import type { windowType } from '~/interfaces/view'
import { getViewMenu } from './menus/view'
import { registerAndGetData } from './core/plugin/data'
import { getHook } from './core/plugin/hook'
import { TabPlugin } from './core/plugin'
import { StorageService } from './services/storage'
import { matchPattern } from './utils'
import type { MainWindow } from './windows/main'

export class View {
  public windowType: windowType = 'mobile'

  public browserView: BrowserView

  private window: MainWindow

  private plugins: TabPlugin

  public bounds:
    | {
        x: number
        y: any
        width: number
        height: number
      }
    | undefined

  public url = ''

  private userAgent = userAgent.mobile

  private lastHostName = ''

  public constructor(window: MainWindow, details: CreateProperties) {
    this.browserView = new BrowserView({
      webPreferences: {
        webSecurity: true,
        sandbox: true,
      },
    })

    this.window = window

    this.webContents.on('context-menu', (e, params) => {
      const menu = getViewMenu(this.window, params, this.webContents)
      menu.popup()
    })

    this.webContents.addListener('page-title-updated', () => {
      this.updateTitle()
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

    this.webContents.addListener('did-navigate', () => {
      this.updateTitle()
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener(
      'did-fail-load',
      (e, errorCode, errorDescription, errorURL, isMainFrame) => {
        // ignore -3 (ABORTED) - An operation was aborted (due to user action).
        if (isMainFrame && errorCode !== -3) {
          const _URL = new URL(`${ERROR_PROTOCOL}://${NETWORK_ERROR_HOST}`)
          _URL.searchParams.append('errorCode', errorCode.toString())
          _URL.searchParams.append('errorURL', errorURL)
          this.webContents.loadURL(_URL.href)
        }
      },
    )

    // Make all links open with the browser, not with the application
    this.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http')) this.webContents.loadURL(url)
      return { action: 'deny' }
    })

    // this.webContents.setUserAgent(this.userAgent)
    // this.session.setUserAgent(this.userAgent)

    this.plugins = new TabPlugin(this.window, this.browserView.webContents)

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
          this.userAgent = userAgent.desktop
        }
        // 移动端
        else if (_userAgent.mobile.some((value) => completeURL.includes(value))) {
          this.userAgent = userAgent.mobile
        } else {
          this.userAgent = userAgent.desktop
        }

        details.requestHeaders['User-Agent'] = this.userAgent

        this.session.setUserAgent(this.userAgent)

        this.resizeWindowSize()
      }

      callback({ requestHeaders: details.requestHeaders })
    })

    // 体验不太好  用resize代替
    // this.browserView.setAutoResize({
    //   width: false,
    //   height: false,
    //   horizontal: false,
    //   vertical: false,
    // })
  }

  private lastUrl = ''

  public updateURL(url: string): void {
    if (this.lastUrl === url) return
    this.lastUrl = url
    const updateUrlHooks = getHook('updateUrl')
    const data = {
      url: new URL(url),
    }
    updateUrlHooks?.before(data)
    this.webContents.setUserAgent(this.userAgent)
    this.webContents.send('load-commit')
    this.emitEvent('url-updated', url)
    updateUrlHooks?.after(data)
  }

  public async resizeWindowSize(windowType?: windowType): Promise<void> {
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
    const appDb = await StorageService.instance.get('appDb')
    if (!appDb) return
    const width = appDb.data.windowSize[targetWindowType][0]
    const height = appDb.data.windowSize[targetWindowType][1]
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
    else if (completeURL.startsWith('passport.bilibili.com/login')) {
      return 'login'
    } else if (completeURL.startsWith('t.bilibili.com/?tab')) {
      return 'feed'
    } else if (this.session.getUserAgent() === userAgent.desktop) {
      return 'desktop'
    }
    return 'mobile'
  }

  public updateNavigationState(): void {
    if (this.browserView.webContents.isDestroyed()) return

    if (this.window.viewManager.selectedId === this.id) {
      this.window.send('updateNavigationState', {
        canGoBack: this.webContents.canGoBack(),
        canGoForward: this.webContents.canGoForward(),
      })
    }
  }

  public destroy(): void {
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

  public emitEvent(event: TabEvent, ...args: any[]): void {
    this.window.send('tabEvent', event, this.id, args)
  }

  public get title() {
    return this.webContents.getTitle()
  }

  public updateTitle(): void {
    const selected = this.window.viewManager.selected

    if (!selected) return

    this.emitEvent('title-updated', selected.title.trim() === '' ? app.name : selected.title)
  }
}
