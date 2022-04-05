import { ElectronBlocker } from '@cliqz/adblocker-electron'
import { app, Session } from 'electron'
import fetch from 'electron-fetch'
import { promises } from 'fs'
import { join } from 'path'

export class AdblockerService {
  public blocker: ElectronBlocker | null = null

  private PREFIX = 'https://liumingye.coding.net/p/bilimini/d'

  private adsLists = [
    `${this.PREFIX}/easylistchina/git/raw/master/easylistchina.txt`,
    `${this.PREFIX}/AdRules/git/raw/main/rules/ADgk.txt`,
  ]

  private config = {
    enableCompression: true,
  }

  private enginePath = join(app.getPath('userData'), 'engine.bin')

  private caching = {
    path: this.enginePath,
    read: promises.readFile,
    write: promises.writeFile,
  }

  constructor(private session: Session) {}

  public enable() {
    ElectronBlocker.fromLists(fetch, this.adsLists, this.config, this.caching).then((blocker) => {
      this.blocker = blocker
      this.blocker.enableBlockingInSession(this.session)
      console.log('blocked load complete')
    })
  }

  public disable() {
    if (!this.blocker) {
      return
    }
    this.blocker.disableBlockingInSession(this.session)
    this.blocker = null
  }
}
