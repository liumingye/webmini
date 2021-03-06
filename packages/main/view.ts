import { app, BrowserView, nativeTheme } from 'electron'
import { clamp, isEmpty } from 'lodash'
import { ERROR_PROTOCOL, NETWORK_ERROR_HOST, userAgent } from '~/common/constant'
import type { CreateProperties, TabEvent } from '~/interfaces/tabs'
import { WindowTypeEnum } from '~/interfaces/view'
import { TabPlugin } from './core/plugin'
import { getViewMenu } from './menus/view'
import { Sessions } from './models/sessions'
import { StorageService } from './services/storage'
import { getDisplayBounds, matchPattern, hookThemeColor } from './utils'
import type { MainWindow } from './windows/main'
import type { PluginMetadata } from '~/interfaces/plugin'

export class View {
  public firstSelect = true

  /** 当前窗口的类型 */
  public windowType: WindowTypeEnum = WindowTypeEnum.MOBILE

  public browserView: BrowserView

  private window: MainWindow

  private tabPlugin: TabPlugin

  /** 存储加载的插件 */
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

  public url: URL | undefined

  private userAgent = userAgent.mobile

  /** 上一个页面的 Url */
  private lastUrl = ''

  /** 上一个页面的 HostName */
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

    this.webContents.addListener('page-title-updated', (e, title) => {
      this.title = title
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
      // if (isEmpty(this.plugins)) {
      //   hookThemeColor()
      //   return
      // }
      hookThemeColor()
      // hookThemeColor(this.plugins[0].name)
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
        // 给getWindowType使用 使用getUrl获取的不对
        this.url = new URL(details.url)

        this.loadPlugins()
        this.setUserAgent()

        details.requestHeaders['User-Agent'] = this.userAgent

        this.resizeWindowSize()
      }
      return { requestHeaders: details.requestHeaders }
    })
  }

  public loadPlugins() {
    if (!this.url || this.lastHostName === this.url.hostname) {
      return
    }
    this.lastHostName = this.url.hostname
    this.tabPlugin.unloadTabPlugins(this.plugins)
    this.plugins = this.tabPlugin.loadTabPlugins(this.url.href)

    hookThemeColor()
  }

  public setUserAgent() {
    if (!this.url) {
      return
    }

    if (!isEmpty(this.plugins) && this.plugins[0].userAgent) {
      const completeURL = `${this.url.hostname}${this.url.pathname}${this.url.search}`

      const userAgentData = this.plugins[0].userAgent

      // the desktop
      if (userAgentData.desktop?.some(matchPattern(completeURL))) {
        this.userAgent = userAgent.desktop
      }
      // the mobile
      else if (userAgentData.mobile?.some(matchPattern(completeURL))) {
        this.userAgent = userAgent.mobile
      } else {
        this.userAgent = userAgent.desktop
      }
    } else {
      this.userAgent = userAgent.desktop
    }

    this.sess.userAgent = this.userAgent
  }

  private onDarkModeChange() {
    if (!this.browserView) return
    const backgroundColor = nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#FFF'
    this.browserView.setBackgroundColor(backgroundColor)
  }

  public async updateURL(url: string): Promise<void> {
    if (this.lastUrl === url) return
    this.lastUrl = url
    if (!isEmpty(this.plugins)) {
      if (typeof this.plugins[0].onUrlChanged === 'function') {
        const data = {
          url: new URL(url),
        }
        // console.log('onUrlChanged')
        if (this.webContents) {
          await this.plugins[0].onUrlChanged(data, this.webContents)
        }
      }
    }
    this.webContents.setUserAgent(this.userAgent)
    this.webContents.send('load-commit')
    this.emitEvent('url-updated', url)
  }

  public async resizeWindowSize(windowType?: WindowTypeEnum, mandatory?: boolean): Promise<void> {
    const targetWindowType = windowType ? windowType : this.getWindowType()

    if (!mandatory && this.windowType === targetWindowType) return

    const displayBounds = getDisplayBounds()
    const currentSize = this.window.win.getSize()
    const leftTopPosition = this.window.win.getPosition()
    const rightBottomPosition = {
      x: leftTopPosition[0] + currentSize[0],
      y: leftTopPosition[1] + currentSize[1],
    }

    const appDb = await StorageService.INSTANCE.get('appDb')
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

    // console.log('resizeWindowSize')
  }

  private getWindowType(): WindowTypeEnum {
    if (!this.url) {
      return WindowTypeEnum.MOBILE
    }

    const completeURL = this.url.hostname + this.url.pathname + this.url.search

    if (!isEmpty(this.plugins) && this.plugins[0].windowType) {
      const windowTypeData = this.plugins[0].windowType

      if (windowTypeData.mini && windowTypeData.mini.some(matchPattern(completeURL))) {
        return WindowTypeEnum.MINI
      }
    }

    // todo: 特殊大小窗口判断代码移动到插件内
    if (completeURL.startsWith('passport.bilibili.com/login')) {
      return WindowTypeEnum.LOGIN
    } else if (completeURL.startsWith('t.bilibili.com/?tab')) {
      return WindowTypeEnum.FEED
    } else if (this.sess.userAgent === userAgent.desktop) {
      return WindowTypeEnum.DESKTOP
    }
    return WindowTypeEnum.MOBILE
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
    // this.webContents.removeAllListeners()
    ;(this.webContents as any).destroy()
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
   * @returns {boolean} 是否被摧毁
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

  public set title(title: string) {
    this.updateTitle(title)
  }

  /**
   * 更新网页标题
   * @param title 网页标题
   */
  public updateTitle(title = this.title): void {
    this.emitEvent('title-updated', title.trim() || app.name)
  }
}
