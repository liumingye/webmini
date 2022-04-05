import { app, dialog } from 'electron'
import is from 'electron-is'
import { autoUpdater } from 'electron-updater'
import ms from 'ms'
import Logger from '~/common/logger'
import { sample } from 'lodash'
import { Timer } from '~/common/timer'

//             Uninitialized
//                   |
//                 Idle  ---------
// (unavailable) /   |            |
//           CheckingForUpdate    |
//                   |            | (error)
//            UpdateAvailable     |
//                   |            |
//              Downloading ------
//                   |
//              Downloaded
//                   |
//              Installing

export interface IUpdateElectronAppOptions {
  /**
   * @param {String} updateInterval
   * How frequently to check for updates.
   */
  readonly updateInterval?: string
  /**
   * @param {Object} logger
   * A custom logger object that defines a `log` function.
   * Defaults to `console`. See electron-log, a module
   * that aggregates logs from main and renderer processes into a single file.
   */
  readonly logger?: typeof Logger
  /**
   * @param {Boolean} notifyUser
   * When enabled the user will be
   * prompted to apply the update immediately after download.
   */
  readonly notifyUser?: boolean
}

const autoUpdaterService = (): void => {
  if (is.dev()) return
  // check for bad input early, so it will be logged during development
  const opts: IUpdateElectronAppOptions = {
    updateInterval: '15 minutes',
    logger: Logger,
    notifyUser: true,
  }
  app.isReady() ? initUpdater(opts) : app.on('ready', () => initUpdater(opts))
}

const initUpdater = (opts: IUpdateElectronAppOptions) => {
  const { updateInterval, logger } = opts

  const log = (...args: any) => {
    logger && logger.info(args)
  }

  // using ghproxy accelerate download
  autoUpdater.netSession.webRequest.onBeforeRequest(
    { urls: ['https://github.com/*/releases/download/*'] },
    ({ url }, callback) => {
      const proxyNode = [
        'https://ghproxy.com/',
        'https://mirror.ghproxy.com/',
        'https://endpoint.fastgit.org/',
      ]
      return callback({ redirectURL: `${sample(proxyNode)}${url}` })
    },
  )

  // an error occurred while updating the trigger
  autoUpdater.on('error', (err) => {
    log('updater error')
    log(err)
  })

  // when start to check the update trigger
  autoUpdater.on('checking-for-update', () => {
    log('checking-for-update')
  })

  // can update the data
  autoUpdater.on('update-available', () => {
    log('update-available; downloading...')
  })

  // no can update the data
  autoUpdater.on('update-not-available', () => {
    log('update-not-available')
  })

  // the download is complete
  if (opts.notifyUser) {
    autoUpdater.on(
      'update-downloaded',
      ({ releaseNotes, releaseName, releaseDate, downloadedFile }) => {
        log('update-downloaded', [releaseNotes, releaseName, releaseDate, downloadedFile])

        const dialogOpts = {
          type: 'info',
          buttons: ['立即更新', '稍后更新'],
          title: `${app.name}更新`,
          message: `发现新版本${releaseName}，重启以应用更新。`,
          detail: releaseNotes.replace(/(<([^>]+)>)/gi, ''),
        }

        dialog.showMessageBox(dialogOpts).then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall()
        })
      },
    )
  }

  // check for updates right away and keep checking later
  autoUpdater.checkForUpdates()
  if (updateInterval) {
    const timer = new Timer(
      () => {
        autoUpdater.checkForUpdates()
      },
      ms(updateInterval),
      { mode: 'interval' },
    )
    timer.start()
  }
}

export default autoUpdaterService
