import { app } from 'electron'
import is from 'electron-is'
import { appId } from '../../electron-builder.json'
import { release } from 'os'
import { initialize } from '@electron/remote/main'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
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

app.whenReady().then(() => {
  // set current data path
  Storage.setDataPath(app.getPath('userData'))
  // start app
  const application = Application.instance
  application.start()

  if (is.dev()) {
    installExtension(VUEJS3_DEVTOOLS.id)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))
  }
})
