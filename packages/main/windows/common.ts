import { enable } from '@electron/remote/main'
import type { BrowserWindow } from 'electron'

export abstract class CommonWindow {
  protected constructor(public win: BrowserWindow) {
    enable(this.webContents)
  }

  public show(): void {
    if (this.win.isMinimized()) {
      this.win.restore()
    }
    this.win.show()
  }

  public hide(): void {
    this.win.hide()
  }

  public toggle(): void {
    if (!this.win || this.isDestroyed()) return
    if (this.win.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }

  public isDestroyed() {
    if (!this.win) return true
    return this.win.isDestroyed()
  }

  public get id() {
    return this.win.webContents.id
  }

  public get webContents() {
    return this.win.webContents
  }

  public get session() {
    return this.win.webContents.session
  }

  public send = (channel: string, ...args: any[]): void => {
    this.webContents.send(channel, ...args)
  }
}
