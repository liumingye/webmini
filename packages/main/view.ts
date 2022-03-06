import { BrowserView, app } from 'electron'
import { MainWindow } from './windows/main'
import { TabEvent } from '~/interfaces/tabs'

export class View {
  public browserView: BrowserView

  private window: MainWindow

  public bounds:
    | {
        x: number
        y: any
        width: number
        height: number
      }
    | undefined

  public lastUrl = ''

  public constructor(window?: MainWindow, details?: { url: string; userAgent?: string }) {
    this.browserView = new BrowserView({
      webPreferences: {
        // preload: 'file://' + resolve(__dirname, '../../dist/inject/index.cjs'),
        preload: `${app.getAppPath()}/dist/inject/index.cjs`,
        // nodeIntegration: false,
        // sandbox: true,
        // plugins: true,
      },
    })

    this.window = window

    this.webContents.on('context-menu', (e, params) => {
      console.log(params)
      // todo 右键菜单
      // this.window.viewManager.hide()
      // setTimeout(() => {
      //   this.window.viewManager.show()
      // }, 1000)
    })

    this.webContents.addListener('page-title-updated', (e, title) => {
      this.emitEvent('title-updated', title)
    })

    this.webContents.addListener('did-start-loading', () => {
      this.emitEvent('loading', true)
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-stop-loading', () => {
      this.emitEvent('loading', false)
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-navigate', async () => {
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-navigate-in-page', async () => {
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.addListener('did-start-navigation', async (e, ...args) => {
      this.emitEvent('load-commit', ...args)
      this.updateURL(this.webContents.getURL())
    })

    this.webContents.setWindowOpenHandler(({ url }) => {
      this.webContents.loadURL(url)
      return { action: 'deny' }
    })

    // details.userAgent && this.browserView.webContents.setUserAgent(details.userAgent)
    this.webContents.loadURL(details.url, {
      userAgent: details.userAgent,
    })

    // 体验不太好 用resize代替
    // this.browserView.setAutoResize({
    //   width: true,
    //   height: true,
    //   horizontal: false,
    //   vertical: false,
    // })
  }

  public updateURL(url: string) {
    if (this.lastUrl === url) return
    this.emitEvent('url-updated', url)
    this.lastUrl = url
  }

  public destroy() {
    ;(this.browserView.webContents as any).destroy()
  }

  // public send(channel: string, ...args: any[]) {
  //   this.webContents.send(channel, ...args)
  // }

  public get webContents() {
    return this.browserView.webContents
  }

  public get id() {
    return this.webContents.id
  }

  public emitEvent(event: TabEvent, ...args: any[]) {
    this.window.send('tab-event', event, this.id, args)
  }
}
