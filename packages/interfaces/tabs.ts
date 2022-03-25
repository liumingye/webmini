import type { LoadURLOptions } from 'electron'
import type { LocalPluginInfo } from './plugin'

export type TabEvent = 'url-updated' | 'title-updated' | 'loading'

export interface CreateProperties {
  plugin: LocalPluginInfo | undefined
  url: string
  active?: boolean
  options?: LoadURLOptions
  index?: number
}
