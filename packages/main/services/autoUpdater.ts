import { app, autoUpdater, dialog } from 'electron'
import ms from 'ms'
import is from 'electron-is'

export interface ILogger {
  log(message: string): void
  info(message: string): void
  error(message: string): void
  warn(message: string): void
}

export interface IUpdateElectronAppOptions {
  /**
   * @param {String} repo A GitHub repository in the format `owner/repo`.
   */
  readonly repo?: string
  /**
   * @param {String} host Defaults to `https://update.electronjs.org`
   */
  readonly host?: string
  /**
   * @param {String} updateInterval How frequently to check for updates. Defaults to `1 hours`.
   *                                Minimum allowed interval is `5 minutes`.
   */
  readonly updateInterval?: string
  /**
   * @param {Object} logger A custom logger object that defines a `log` function.
   *                        Defaults to `console`. See electron-log, a module
   *                        that aggregates logs from main and renderer processes into a single file.
   */
  readonly logger?: ILogger
  /**
   * @param {Boolean} notifyUser Defaults to `true`.  When enabled the user will be
   *                             prompted to apply the update immediately after download.
   */
  readonly notifyUser?: boolean
}

const supportedPlatforms = ['darwin', 'win32']

const autoUpdaterService = (opts: IUpdateElectronAppOptions = {}): void  => {
  if (is.dev()) return
  // check for bad input early, so it will be logged during development
  opts = validateInput(opts)
  app.isReady() ? initUpdater(opts) : app.on('ready', () => initUpdater(opts))
}

const initUpdater = (opts: IUpdateElectronAppOptions) => {
  const { host, repo, updateInterval, logger } = opts
  const feedURL = `${host}/${repo}/${process.platform}-${process.arch}/${app.getVersion()}`

  const log = (...args: any) => {
    logger && logger.log(args)
  }

  // exit early on unsupported platforms, e.g. `linux`
  if (
    typeof process !== 'undefined' &&
    process.platform &&
    !supportedPlatforms.includes(process.platform)
  ) {
    log(`Electron's autoUpdater does not support the '${process.platform}' platform`)
    return
  }

  log('feedURL', feedURL)
  autoUpdater.setFeedURL({ url: feedURL })

  autoUpdater.on('error', (err) => {
    log('updater error')
    log(err)
  })

  autoUpdater.on('checking-for-update', () => {
    log('checking-for-update')
  })

  autoUpdater.on('update-available', () => {
    log('update-available; downloading...')
  })

  autoUpdater.on('update-not-available', () => {
    log('update-not-available')
  })

  if (opts.notifyUser) {
    autoUpdater.on(
      'update-downloaded',
      (event, releaseNotes, releaseName, releaseDate, updateURL) => {
        log('update-downloaded', [event, releaseNotes, releaseName, releaseDate, updateURL])

        const dialogOpts = {
          type: 'info',
          buttons: ['重启', '以后'],
          title: '发现新版本',
          message: process.platform === 'win32' ? releaseNotes : releaseName,
          detail: '新版本已下载完成，重新启动程序以应用更新。',
        }

        dialog.showMessageBox(dialogOpts).then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall()
        })
      },
    )
  }

  // check for updates right away and keep checking later
  autoUpdater.checkForUpdates()
  updateInterval &&
    setInterval(() => {
      autoUpdater.checkForUpdates()
    }, ms(updateInterval))
}

const validateInput = (opts: IUpdateElectronAppOptions) => {
  const defaults = {
    host: 'https://update.electronjs.org',
    repo: 'liumingye/bilimini',
    updateInterval: '1 hour',
    logger: console,
    notifyUser: true,
  }
  return Object.assign(defaults, opts)
}

export default autoUpdaterService
