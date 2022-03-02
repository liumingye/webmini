import { app } from 'electron'
import { release } from 'os'
import { initialize } from '@electron/remote/main'
import updateElectronApp from './services/auto-updater'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { isWindows } from '../common/platform'
import { Application } from './application'
import { isDev } from '../common/utils'
import Storage from 'electron-json-storage'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (isWindows) app.setAppUserModelId(app.getName())

initialize()

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(() => {
  // set current data path
  Storage.setDataPath(app.getPath('userData'))
  // start app
  const application = Application.instance
  application.start()

  if (isDev) {
    installExtension(VUEJS3_DEVTOOLS.id)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))
  } else {
    updateElectronApp()
  }
})
