import { initialize } from '@electron/remote/main'
import { app, ipcMain, webContents } from 'electron'
import is from 'electron-is'
import { release } from 'os'
import { build } from '../../package.json'
import { Application } from './application'

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (is.windows()) app.setAppUserModelId(build.appId)

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

/**
 * initialize the main-process side of the remote module
 */
initialize()

// app.commandLine.appendSwitch('--enable-transparent-visuals')
// 叠加滚动条
app.commandLine.appendSwitch('--enable-features', 'OverlayScrollbar')

ipcMain.setMaxListeners(0)

// set current data path
// Storage.setDataPath(app.getPath('userData'))

// start app
const application = Application.instance
application.start()

ipcMain.handle(`web-contents-call`, async (e, { webContentsId, method, args = [] }) => {
  const wc = webContents.fromId(webContentsId)
  const result = (wc as any)[method](...args)

  if (result) {
    if (result instanceof Promise) {
      return await result
    }

    return result
  }
})
