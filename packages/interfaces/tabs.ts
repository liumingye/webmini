import { LoadURLOptions } from 'electron'

export type TabEvent = 'url-updated' | 'title-updated' | 'loading'

export interface CreateProperties {
  url: string
  active?: boolean
  options?: LoadURLOptions
  index?: number
}
