import { CommonWindow } from './common'
import { BrowserWindow, app, shell } from 'electron'
import { join } from 'path'
import { URL } from '../../common/utils'
import { isMacintosh } from '../../common/platform'

export class MainWindow extends CommonWindow {
  public constructor(window?: BrowserWindow) {
    window = new BrowserWindow({
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

    window.loadURL(URL)

    window.on('close', () => {
      if (!isMacintosh) {
        process.nextTick(() => {
          app.quit()
        })
      }
    })

    // Make all links open with the browser, not with the application
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    super(window)
  }
}
