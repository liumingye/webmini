import { ITab } from './model'

export interface CreateProperties {
  url: string
  active: boolean
  // pinned?: boolean
  index?: number
}

export interface TabsStateTypes {
  list: ITab[]
  removedTabs: number
}
