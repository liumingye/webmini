import type { WebContents, Session } from 'electron'

export interface CommonWindowApi {
  id: number
  show(): void
  hide(): void
  toggle(): void
  isDestroyed(): boolean
  webContents: WebContents
  session: Session
  send(channel: string, ...args: any[]): void
}
