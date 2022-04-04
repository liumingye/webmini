import type { WebContents, Session } from 'electron'

interface CommonWindowApi {
  id: number
  show(): void
  hide(): void
  toggle(): void
  isDestroyed(): boolean
  webContents: WebContents
  session: Session
  send(channel: string, ...args: any[]): void
}

export { CommonWindowApi }
