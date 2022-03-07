import { BrowserView, app } from 'electron'
import { MainWindow } from './windows/main'
import { TabEvent, CreateProperties } from '~/interfaces/tabs'

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

  private lastUrl = ''

  public constructor(window: MainWindow, details: CreateProperties) {
    this.browserView = new BrowserView({
      webPreferences: {
        preload: `${app.getAppPath()}/dist/inject/index.cjs`,
      },
    })

    this.window = window

    this.webContents.on('context-menu', (e, params) => {
      console.log(params)
      // todo 右键菜单
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

    this.webContents.loadURL(details.url, details.options)

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
    this.window.send('tab-event', event, this.id, args)
  }
}
