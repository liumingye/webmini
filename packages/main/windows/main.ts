import { CommonWindow } from './common'
import { BrowserWindow, app, shell } from 'electron'
import { join } from 'path'
import { URL } from '../../common/utils'
import { isMacintosh } from '../../common/platform'
import Storage from 'electron-json-storage'

export class MainWindow extends CommonWindow {
  public constructor(window?: BrowserWindow) {
    const bound: Record<string, number> = {}
    const config: any = Storage.getSync('config')
    const windowPosition = config['windowPosition']
    if (windowPosition) {
      bound.x = windowPosition[0]
      bound.y = windowPosition[1]
    }
    const windowSize = config['windowSize']
    if (windowSize && windowSize['mobile']) {
      bound.width = windowSize['mobile'][0]
      bound.height = windowSize['mobile'][1]
    } else {
      bound.width = 376
      bound.height = 500
    }
    window = new BrowserWindow({
      ...bound,
      // opacity: 0.5,
      minHeight: 170,
      minWidth: 300,
      frame: false, // 是否有边框
      maximizable: false,
      alwaysOnTop: true,
      webPreferences: {
        webviewTag: true,
        preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
        nativeWindowOpen: false,
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
