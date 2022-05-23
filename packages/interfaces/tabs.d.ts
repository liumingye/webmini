import type { LoadURLOptions } from 'electron'
import type { LocalPluginInfo } from './plugin'

type EventName<T extends string> = `${T}-updated`

export type TabEvent = EventName<'url' | 'title'> | 'loading'

export interface CreateProperties {
  plugin: LocalPluginInfo | undefined
  url: string
  active?: boolean
  options?: LoadURLOptions
  index?: number
}
