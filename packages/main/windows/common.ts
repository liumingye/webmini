import { BrowserWindow } from 'electron'
import { enable } from '@electron/remote/main'

export class CommonWindow {
  public win: BrowserWindow

  public constructor(window: BrowserWindow) {
    this.win = window
    enable(this.webContents)
  }

  public show(): void  {
    this.win.show()
  }

  public hide(): void  {
    this.win.hide()
  }

  public toggle(): void  {
    if (this.isDestroyed()) return
    if (this.win.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }

  public isDestroyed() {
    return this.win.isDestroyed()
  }

  public get id() {
    return this.win.webContents.id
  }

  public get webContents() {
    return this.win.webContents
  }

  public send(channel: string, ...args: any[]): void  {
    this.webContents.send(channel, ...args)
  }
}
