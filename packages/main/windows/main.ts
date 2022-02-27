import { BrowserWindow, app, shell } from 'electron'
import { enable } from '@electron/remote/main'
import { join } from 'path'
import { URL } from '../../common/utils'
import { isMacintosh } from '../../common/platform'

export class MainWindow {
  public win: BrowserWindow

  public constructor() {
    this.win = new BrowserWindow({
      width: 376,
      height: 500,
      minHeight: 170,
      minWidth: 300,
      frame: false, // 是否有边框
      maximizable: false,
      alwaysOnTop: true,
      webPreferences: {
        webviewTag: true,
        preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
        nativeWindowOpen: false,
        webSecurity: false,
      },
    })

    this.win.loadURL(URL)

    enable(this.win.webContents)

    this.win.on('close', () => {
      // this.win = null
      if (!isMacintosh) {
        process.nextTick(() => {
          app.quit()
        })
      }
    })

    // Make all links open with the browser, not with the application
    this.win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  public get id() {
    return this.win.webContents.id
  }

  public get webContents() {
    return this.win.webContents
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args)
  }
}
