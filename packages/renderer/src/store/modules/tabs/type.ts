import { ITab } from './model'

export interface CreateProperties {
  url: string
  active: boolean
  // pinned?: boolean
  index?: number
  userAgent?: string
}

export interface TabsStateTypes {
  list: ITab[]
  selectedTabId: number
}
