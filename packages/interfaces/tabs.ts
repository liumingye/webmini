import { LoadURLOptions } from 'electron'

export type TabEvent =
  | 'load-commit'
  | 'url-updated'
  | 'title-updated'
  | 'favicon-updated'
  | 'did-navigate'
  | 'loading'
  | 'pinned'
  | 'credentials'
  | 'blocked-ad'
  | 'zoom-updated'
  | 'media-playing'
  | 'media-paused'

export interface CreateProperties {
  url: string
  active?: boolean
  options?: LoadURLOptions
  index?: number
}
