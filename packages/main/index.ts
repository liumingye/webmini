import { app, ipcMain, webContents } from 'electron'
import is from 'electron-is'
import { appId } from '../../electron-builder.json'
import { release } from 'os'
import { initialize } from '@electron/remote/main'
import { Application } from './application'
import Storage from 'electron-json-storage'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (is.windows()) app.setAppUserModelId(appId)

/**
 * initialize the main-process side of the remote module
 */
initialize()

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// app.commandLine.appendSwitch('--enable-transparent-visuals')
// 叠加滚动条
app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar')

ipcMain.setMaxListeners(0)

// set current data path
Storage.setDataPath(app.getPath('userData'))

// start app
const application = Application.instance
application.start()

ipcMain.handle(`webContentsCall`, async (e, { webContentsId, method, args = [] }) => {
  const wc = webContents.fromId(webContentsId)
  const result = (wc as any)[method](...args)

  if (result) {
    if (result instanceof Promise) {
      return await result
    }

    return result
  }
})
