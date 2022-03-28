import { app, BrowserView, nativeTheme } from 'electron'
import { clamp, isEmpty } from 'lodash'
import { ERROR_PROTOCOL, NETWORK_ERROR_HOST, userAgent } from '~/common/constant'
import type { CreateProperties, TabEvent } from '~/interfaces/tabs'
import { WindowType } from '~/interfaces/view'
import { TabPlugin } from './core/plugin'
import { registerAndGetData } from './core/plugin/data'
import { getHook } from './core/plugin/hook'
import { getViewMenu } from './menus/view'
import { Sessions } from './models/sessions'
import { StorageService } from './services/storage'
import { getDisplayBounds, matchPattern, hookThemeColor } from './utils'
import type { MainWindow } from './windows/main'
import type { PluginMetadata } from '~/interfaces/plugin'

export class View {
  public windowType: WindowType = WindowType.MOBILE

  public browserView: BrowserView

  private window: MainWindow

  private tabPlugin: TabPlugin

  public plugins: PluginMetadata[] = []

  private sess: Sessions

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

  private lastUrl = ''

  private lastHostName = ''

  public themeColor: string | null = null

  public constructor(window: MainWindow, details: CreateProperties) {
    this.browserView = new BrowserView({
      webPreferences: {
        webSecurity: true,
        sandbox: true,
      },
    })

    this.onDarkModeChange()
    nativeTheme.addListener('updated', this.onDarkModeChange)

    this.window = window

    this.webContents.on('context-menu', (e, params) => {
      const menu = getViewMenu(this.window, params, this.webContents)
      menu.popup({ window: this.window.win })
    })

    this.webContents.addListener('page-title-updated', () => {
      this.updateTitle()
    })

    this.webContents.addListener('did-start-loading', () => {
      this.themeColor = null
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
      this.updateNavigationState()
      this.updateTitle()
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-change-theme-color', (_e, color) => {
      this.themeColor = color
      if (isEmpty(this.plugins)) {
        hookThemeColor()
        return
      }
      hookThemeColor(this.plugins[0].name)
    })

    this.webContents.addListener(
      'did-fail-load',
      (_e, errorCode, _errorDescription, errorURL, isMainFrame) => {
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

    this.tabPlugin = new TabPlugin(this.browserView.webContents)

    this.webContents.loadURL(details.url, details.options)

    // register session
    this.sess = new Sessions(this.session)
    this.sess.register('onBeforeSendHeaders', (details) => {
      // ban on track
      details.requestHeaders['DNT'] = '1'

      // according to the browser plug-in configuration settings for ua
      if (details.resourceType === 'mainFrame' && details.url.startsWith('http')) {
        // set the current url
        // 给resizeWindowSize使用 使用getUrl获取的不对
        this.url = details.url

        const url = new URL(this.url)

        const completeURL = url.hostname + url.pathname + url.search

        if (this.lastHostName !== url.hostname) {
          this.lastHostName = url.hostname
          this.tabPlugin.unloadTabPlugins(this.plugins)
          this.plugins = this.tabPlugin.loadTabPlugins(url.href)
        }

        if (isEmpty(this.plugins)) {
          this.userAgent = userAgent.desktop
        } else {
          type UserAgent = {
            mobile: string[]
            desktop: string[]
          }

          const userAgentProvider = {
            mobile: [],
            desktop: [],
          }

          const [userAgentData]: UserAgent[] = registerAndGetData(
            this.plugins[0].name,
            'userAgent',
            userAgentProvider,
          )

          // the desktop
          if (userAgentData.desktop.some((value) => completeURL.includes(value))) {
            this.userAgent = userAgent.desktop
          }
          // the mobile
          else if (userAgentData.mobile.some((value) => completeURL.includes(value))) {
            this.userAgent = userAgent.mobile
          } else {
            this.userAgent = userAgent.desktop
          }
        }

        details.requestHeaders['User-Agent'] = this.userAgent
        this.sess.userAgent = this.userAgent

        this.resizeWindowSize()
      }
      return { requestHeaders: details.requestHeaders }
    })
  }

  private onDarkModeChange() {
    if (!this.browserView) return
    const backgroundColor = nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#FFF'
    this.browserView.setBackgroundColor(backgroundColor)
  }

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

  public async resizeWindowSize(windowType?: WindowType): Promise<void> {
    const targetWindowType = windowType ? windowType : this.getWindowType()

    if (this.windowType === targetWindowType) return

    const displayBounds = getDisplayBounds()
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

    this.window.send('set-currentWindow-type', targetWindowType)
  }

  private getWindowType() {
    const _URL = new URL(this.url)
    const completeURL = _URL.hostname + _URL.pathname + _URL.search

    if (!isEmpty(this.plugins)) {
      const windowTypeProvider = {
        mini: [],
      }
      const [windowTypeData] = registerAndGetData(
        this.plugins[0].name,
        'windowType',
        windowTypeProvider,
      )
      if (windowTypeData.mini.some(matchPattern(completeURL))) {
        return WindowType.MINI
      }
    }

    // todo: 特殊大小窗口判断代码移动到插件内
    if (completeURL.startsWith('passport.bilibili.com/login')) {
      return WindowType.LOGIN
    } else if (completeURL.startsWith('t.bilibili.com/?tab')) {
      return WindowType.FEED
    } else if (this.sess.userAgent === userAgent.desktop) {
      return WindowType.DESKTOP
    }
    return WindowType.MOBILE
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
    if (!this.browserView) return
    // removeListener updated
    nativeTheme.removeListener('updated', this.onDarkModeChange)
    // unregister session
    this.sess.destroy()
    // unload plugins
    this.tabPlugin.unloadTabPlugins()
    // destroy
    ;(this.browserView.webContents as any).destroy()
    this.browserView = null as any
  }

  public get session(): Electron.Session {
    return this.webContents.session
  }

  public get webContents(): Electron.WebContents {
    return this.browserView.webContents
  }

  /**
   * 网页是否被摧毁
   * @returns {boolean}
   */
  public isDestroyed(): boolean {
    return this.browserView.webContents.isDestroyed()
  }

  /**
   * 获取 webContents id
   */
  public get id(): number {
    return this.webContents.id
  }

  /**
   * 发送事件
   * @param event
   * @param args
   */
  public emitEvent(event: TabEvent, ...args: any[]): void {
    this.window.send('tab-event', event, this.id, args)
  }

  /**
   * 获取网页标题
   */
  public get title(): string {
    return this.webContents.getTitle()
  }

  /**
   * 发送更新标题事件
   */
  public updateTitle(): void {
    const selected = this.window.viewManager.selected

    if (!selected) return

    this.emitEvent('title-updated', selected.title.trim() === '' ? app.name : selected.title)
  }
}
