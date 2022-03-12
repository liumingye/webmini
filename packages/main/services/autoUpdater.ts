import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import ms from 'ms'
import is from 'electron-is'
import Logger from '~/common/logger'

export interface IUpdateElectronAppOptions {
  /**
   * @param {String} host
   */
  readonly host?: string
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

const supportedPlatforms = ['darwin', 'win32']

const autoUpdaterService = (): void => {
  if (is.dev()) return
  // check for bad input early, so it will be logged during development
  const opts: IUpdateElectronAppOptions = {
    host: 'https://webmini.vercel.app',
    updateInterval: '15 minutes',
    logger: Logger,
    notifyUser: true,
  }
  app.isReady() ? initUpdater(opts) : app.on('ready', () => initUpdater(opts))
}

const initUpdater = (opts: IUpdateElectronAppOptions) => {
  const { host, updateInterval, logger } = opts
  const feedURL = `${host}/update/${process.platform}/${app.getVersion()}`

  const log = (...args: any) => {
    logger && logger.info(args)
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
  // autoUpdater.setFeedURL({ url: feedURL })

  // 当更新发生错误的时候触发。
  autoUpdater.on('error', (err) => {
    log('updater error')
    log(err)
  })

  // 当开始检查更新的时候触发
  autoUpdater.on('checking-for-update', () => {
    log('checking-for-update')
  })

  // 发现可更新数据时
  autoUpdater.on('update-available', () => {
    log('update-available; downloading...')
  })

  // 没有可更新数据时
  autoUpdater.on('update-not-available', () => {
    log('update-not-available')
  })

  // 下载完成
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

export default autoUpdaterService
