import { BrowserView } from 'electron'
import { MainWindow } from './windows/main'

export class View {
  public browserView: BrowserView

  private window: MainWindow

  public bounds: any

  public constructor(window: MainWindow, url: string) {
    this.browserView = new BrowserView({
      webPreferences: {
        // preload: `${app.getAppPath()}/build/view-preload.bundle.js`,
        // nodeIntegration: false,
        // contextIsolation: true,
        // sandbox: true,
        // enableRemoteModule: false,
        // partition: incognito ? 'view_incognito' : 'persist:view',
        // plugins: true,
        // nativeWindowOpen: true,
        // webSecurity: true,
        // javascript: true,
        // worldSafeExecuteJavaScript: false,
      },
    })
    ;(this.webContents as any).windowId = window.win.id
    this.window = window

    // ipcRenderer.on(
    //   'create-tab',
    //   (e, options: chrome.tabs.CreateProperties, isNext: boolean, id: number) => {
    //     if (isNext) {
    //       // const index = this.list.indexOf(this.selectedTab) + 1
    //       // options.index = index
    //     }

    //     // this.createTab(options, id)
    //   },
    // )

    this.webContents.loadURL(url)
    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    })
  }

  public destroy() {
    ;(this.browserView.webContents as any).destroy()
    // this.browserView = null
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args)
  }

  public get webContents() {
    return this.browserView.webContents
  }

  public get id() {
    return this.webContents.id
  }
}
